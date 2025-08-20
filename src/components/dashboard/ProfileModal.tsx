import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Profile } from '@/App';
import { useToast } from '@/hooks/use-toast';
import { KeyRound, Loader2 } from 'lucide-react';
import { Socket } from 'socket.io-client';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (profileData: Profile, originalProfileName?: string) => void;
  profile: Profile | null;
  socket: Socket | null;
}

const SERVER_URL = "http://localhost:3000";

export const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose, onSave, profile, socket }) => {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [formData, setFormData] = useState<Profile>({
    profileName: '',
    orgId: '',
    refreshToken: '',
    defaultDepartmentId: '',
    fromEmailAddress: '',
    clientId: '',
    clientSecret: '',
    mailReplyAddressId: '',
  });

  useEffect(() => {
    if (profile) {
      setFormData(profile);
    } else {
      setFormData({
        profileName: '',
        orgId: '',
        refreshToken: '',
        defaultDepartmentId: '',
        fromEmailAddress: '',
        clientId: '',
        clientSecret: '',
        mailReplyAddressId: '',
      });
    }
  }, [profile, isOpen]);

  // Listen for token from server via Socket.IO
  useEffect(() => {
    if (!socket || !isOpen) return;

    const handleTokenReceived = (data: { refreshToken: string }) => {
      setFormData(prev => ({ ...prev, refreshToken: data.refreshToken }));
      setIsGenerating(false);
      toast({ title: "Success!", description: "Refresh token has been populated." });
    };

    const handleTokenError = (data: { error: string }) => {
        setIsGenerating(false);
        toast({ title: "Token Generation Error", description: data.error, variant: "destructive" });
    }

    socket.on('zoho-refresh-token', handleTokenReceived);
    socket.on('zoho-refresh-token-error', handleTokenError);

    return () => {
      socket.off('zoho-refresh-token', handleTokenReceived);
      socket.off('zoho-refresh-token-error', handleTokenError);
    };
  }, [socket, isOpen, toast]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData, profile?.profileName);
  };

  const handleGenerateToken = async () => {
    if (!formData.clientId || !formData.clientSecret) {
      toast({
        title: "Missing Information",
        description: "Please enter a Client ID and Client Secret first.",
        variant: "destructive",
      });
      return;
    }
    if (!socket) {
        toast({ title: "Error", description: "Not connected to the server.", variant: "destructive" });
        return;
    }
    
    setIsGenerating(true);

    try {
      const response = await fetch(`${SERVER_URL}/api/zoho/auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            clientId: formData.clientId, 
            clientSecret: formData.clientSecret,
            socketId: socket.id 
        }),
      });
      if (!response.ok) throw new Error("Failed to get auth URL from server.");

      const { authUrl } = await response.json();
      window.open(authUrl, '_blank', 'width=600,height=700');

    } catch (error) {
      toast({ title: "Error", description: "Could not initiate authorization.", variant: "destructive" });
      setIsGenerating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{profile ? 'Edit Profile' : 'Add New Profile'}</DialogTitle>
          <DialogDescription>
            {profile ? 'Update the details for this Zoho Desk profile.' : 'Enter the details for the new Zoho Desk profile.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="profileName" className="text-right">Profile Name</Label>
              <Input id="profileName" name="profileName" value={formData.profileName} onChange={handleChange} className="col-span-3" required />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="clientId" className="text-right">Client ID</Label>
              <Input id="clientId" name="clientId" value={formData.clientId} onChange={handleChange} className="col-span-3" required />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="clientSecret" className="text-right">Client Secret</Label>
              <Input id="clientSecret" name="clientSecret" value={formData.clientSecret} onChange={handleChange} className="col-span-3" required />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="refreshToken" className="text-right">Refresh Token</Label>
              <div className="col-span-3 flex items-center gap-2">
                <Input id="refreshToken" name="refreshToken" value={formData.refreshToken} onChange={handleChange} className="flex-1" required />
                <Button type="button" variant="outline" onClick={handleGenerateToken} disabled={isGenerating}>
                   {isGenerating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <KeyRound className="h-4 w-4 mr-2" />}
                  Generate
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="orgId" className="text-right">Org ID</Label>
              <Input id="orgId" name="orgId" value={formData.orgId} onChange={handleChange} className="col-span-3" required />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="defaultDepartmentId" className="text-right">Department ID</Label>
              <Input id="defaultDepartmentId" name="defaultDepartmentId" value={formData.defaultDepartmentId} onChange={handleChange} className="col-span-3" required />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="fromEmailAddress" className="text-right">From Email</Label>
              <Input id="fromEmailAddress" name="fromEmailAddress" value={formData.fromEmailAddress || ''} onChange={handleChange} className="col-span-3" placeholder="e.g., support@yourcompany.zohodesk.com" />
            </div>
             <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="mailReplyAddressId" className="text-right">Mail Reply ID</Label>
              <Input id="mailReplyAddressId" name="mailReplyAddressId" value={formData.mailReplyAddressId || ''} onChange={handleChange} className="col-span-3" placeholder="(Optional)" />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit">Save Profile</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
