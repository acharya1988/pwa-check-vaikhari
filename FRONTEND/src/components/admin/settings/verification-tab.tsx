

'use client';

import React, { useActionState, useEffect, useRef, useState, useTransition } from 'react';
import { useFormStatus } from 'react-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { requestPersonalVerification } from '@/actions/profile.actions';
import { sendEmailOtpAction, verifyEmailOtpAction } from '@/actions/verification.actions';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { LineStepper } from '@/components/ui/stepper';
import { auth } from '@/lib/firebase/config';
import { RecaptchaVerifier, signInWithPhoneNumber, type ConfirmationResult } from 'firebase/auth';
import { Separator } from '@/components/ui/separator';
import type { UserProfile } from '@/types';


function SubmitButton({ children, disabled }: { children?: React.ReactNode, disabled?: boolean }) {
    const { pending } = useFormStatus();
    return (
        <Button disabled={pending || disabled}>
            {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {children || 'Save Changes'}
        </Button>
    );
}

function EmailVerificationSection({ userProfile }: { userProfile: UserProfile }) {
    const { toast } = useToast();
    const [sendState, sendAction] = useActionState(sendEmailOtpAction, null);
    const [verifyState, verifyAction] = useActionState(verifyEmailOtpAction, null);
    const otpRef = useRef<HTMLInputElement>(null);
    const [isSendPending, startSendTransition] = useTransition();
    const [isVerifyPending, startVerifyTransition] = useTransition();

    const [isOtpSent, setIsOtpSent] = useState(false);
    const [isEmailVerified, setIsEmailVerified] = useState(userProfile.emailVerified || false);
    
    useEffect(() => {
        if(sendState?.success) {
            toast({ title: 'Success', description: 'OTP sent to your email.'});
            setIsOtpSent(true);
        }
        if(sendState?.error) {
            toast({ variant: 'destructive', title: 'Error', description: sendState.error });
        }
    }, [sendState, toast]);
    
    useEffect(() => {
        if(verifyState?.success) {
            toast({ title: 'Success', description: 'Email verified successfully!'});
            setIsEmailVerified(true);
        }
        if(verifyState?.error) {
            toast({ variant: 'destructive', title: 'Error', description: verifyState.error });
        }
    }, [verifyState, toast]);
    
    const handleSendEmailOtp = () => {
        startSendTransition(() => {
            const formData = new FormData();
            formData.append('email', userProfile.email);
          console.log("⚠️ otp",formData);

            sendAction(formData);
        });
    }
    
    const handleVerifyEmailOtp = () => {
        if (!otpRef.current?.value) {
          console.log("⚠️ No OTP entered");
          toast({ variant: 'destructive', title: 'Error', description: "Please enter the OTP." });
          return;
        }
      
        console.log("🔑 Submitting OTP:", otpRef.current!.value);
      
        startVerifyTransition(() => {
          const formData = new FormData();
          formData.append('otp', otpRef.current!.value);
      
          console.log("📤 FormData prepared with OTP:", formData.get('otp'));
          verifyAction(formData);
        });
      };
      
      if (isEmailVerified) {
        console.log("✅ Email is verified, showing success message");
        return <p className="text-sm text-green-600">✓ Email Verified</p>;
      }
      

    return (
        <div className="space-y-4">
             <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="flex items-center gap-2">
                    <Input id="email" name="email" type="email" placeholder="user@example.com" defaultValue={userProfile.email} required readOnly />
                    <Button type="button" variant="outline" onClick={handleSendEmailOtp} disabled={isOtpSent || isSendPending}>
                        {isSendPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : isOtpSent ? 'OTP Sent' : 'Send OTP'}
                    </Button>
                </div>
            </div>
            
            {isOtpSent && !isEmailVerified && (
                 <div className="flex items-center gap-2">
                    <Input id="otp" name="otp" placeholder="Enter OTP" required ref={otpRef} />
                    <Button type="button" onClick={handleVerifyEmailOtp} disabled={isVerifyPending}>
                         {isVerifyPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Verify OTP
                    </Button>
                </div>
            )}
        </div>
    )
}

function VerificationDialog({ userProfile }: { userProfile: UserProfile }) {
    const [open, setOpen] = useState(false);
    const [state, formAction] = useActionState(requestPersonalVerification, null);
    const { toast } = useToast();
    const [currentStep, setCurrentStep] = useState(1);
    
    const [phoneNumber, setPhoneNumber] = useState('');
    const [countryCode, setCountryCode] = useState('+91');
    const [otp, setOtp] = useState('');
    const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
    const [isOtpSent, setIsOtpSent] = useState(false);
    const [isPhoneVerified, setIsPhoneVerified] = useState(false);
    const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);
    const [isSendingOtp, setIsSendingOtp] = useState(false);
    const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);

    useEffect(() => {
        if (open && typeof window !== 'undefined' && !recaptchaVerifierRef.current) {
            recaptchaVerifierRef.current = new RecaptchaVerifier(auth, 'recaptcha-container', {
                'size': 'invisible'
            });
        }
    }, [open]);

    useEffect(() => {
        if (state?.success) {
            toast({ title: "Request Sent", description: state.message });
            setOpen(false);
        }
        if (state?.error) {
            toast({ variant: 'destructive', title: "Error", description: state.error });
        }
    }, [state, toast]);
    
    const handleSendOtp = async () => {
        let number = phoneNumber.trim();
        if (!number) {
            toast({ variant: 'destructive', title: 'Error', description: 'Please enter a phone number.'});
            return;
        }
        
        const formattedPhoneNumber = `${countryCode.startsWith('+') ? countryCode : '+' + countryCode}${number}`;
        
        setIsSendingOtp(true);
        try {
            const appVerifier = recaptchaVerifierRef.current!;
            const result = await signInWithPhoneNumber(auth, formattedPhoneNumber, appVerifier);
            setConfirmationResult(result);
            setIsOtpSent(true);
            toast({ title: 'OTP Sent', description: 'A one-time password has been sent to your phone.' });
        } catch (error: any) {
            console.error("Firebase OTP Error:", error);
            toast({ variant: 'destructive', title: 'OTP Error', description: `Failed to send OTP. This may be a project configuration issue.` });
        } finally {
            setIsSendingOtp(false);
        }
    };

    const handleVerifyOtp = async () => {
        if (!confirmationResult || !otp) {
            toast({ variant: 'destructive', title: 'Error', description: 'Please enter the OTP.' });
            return;
        }
        setIsVerifyingOtp(true);
        try {
            await confirmationResult.confirm(otp);
            setIsPhoneVerified(true);
            toast({ title: 'Phone Verified', description: 'Your phone number has been successfully verified.' });
        } catch (error: any) {
             console.error("Firebase OTP Verification Error:", error);
             toast({ variant: 'destructive', title: 'Verification Error', description: `Invalid OTP: ${error.message}` });
        } finally {
            setIsVerifyingOtp(false);
        }
    };
    
    const isStep2Complete = isPhoneVerified && (userProfile.emailVerified || false);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <div id="recaptcha-container"></div>
            <DialogTrigger asChild>
                 <Button>Request Personal Verification</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Personal Verification Request</DialogTitle>
                    <DialogDescription>Complete the steps below to submit your verification request.</DialogDescription>
                </DialogHeader>
                <form action={formAction} className="space-y-4">
                    <div className="flex justify-center my-8">
                       <LineStepper currentStep={currentStep} onStepClick={setCurrentStep} steps={[{label: "Personal Details"}, {label: "Contact Verification"}]} />
                    </div>

                    {currentStep === 1 && (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="verificationFullName">Full Legal Name</Label>
                                <Input id="verificationFullName" name="fullName" required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="address">Full Address</Label>
                                <Textarea id="address" name="address" placeholder="Street, Apartment, etc." required />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="city">City</Label>
                                    <Input id="city" name="city" required />
                                </div>
                                 <div className="space-y-2">
                                    <Label htmlFor="state">State / Province</Label>
                                    <Input id="state" name="state" required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="pincode">PIN / Postal Code</Label>
                                    <Input id="pincode" name="pincode" required />
                                </div>
                            </div>
                        </div>
                    )}
                    
                     {currentStep === 2 && (
                        <div className="space-y-6">
                            <div className="p-2 border rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 text-xs">
                                <strong>Test Instructions:</strong> Add a test phone number (e.g., +1 650-555-3434) and a fixed OTP (e.g., 123456) in your Firebase Console under Authentication &gt; Sign-in method &gt; Phone.
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="phone">Phone Number</Label>
                                <div className="flex items-center gap-2">
                                    <Select value={countryCode} onValueChange={setCountryCode}>
                                        <SelectTrigger className="w-[80px]">
                                            <SelectValue/>
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="+91">IN +91</SelectItem>
                                            <SelectItem value="+1">US +1</SelectItem>
                                            <SelectItem value="+44">UK +44</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <Input id="phone" name="phone" type="tel" placeholder="Your phone number" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} disabled={isOtpSent} className="flex-1" />
                                    <Button type="button" variant="outline" onClick={handleSendOtp} disabled={isOtpSent || isSendingOtp}>
                                        {isSendingOtp ? <Loader2 className="h-4 w-4 animate-spin"/> : isOtpSent ? 'OTP Sent' : 'Send OTP'}
                                    </Button>
                                </div>
                            </div>
                            {isOtpSent && !isPhoneVerified && (
                                <div className="flex items-center gap-2">
                                    <Input id="otp" name="otp" placeholder="Enter OTP" value={otp} onChange={(e) => setOtp(e.target.value)} />
                                    <Button type="button" onClick={handleVerifyOtp} disabled={isVerifyingOtp}>
                                        {isVerifyingOtp && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Verify OTP
                                    </Button>
                                </div>
                            )}
                             {isPhoneVerified && <p className="text-sm text-green-600">✓ Phone Verified</p>}

                             <Separator />

                             <EmailVerificationSection userProfile={userProfile} />
                        </div>
                     )}

                    <DialogFooter>
                        {currentStep === 1 ? (
                             <Button type="button" onClick={() => setCurrentStep(2)}>Next</Button>
                        ) : (
                            <>
                                <Button type="button" variant="outline" onClick={() => setCurrentStep(1)}>Back</Button>
                                <SubmitButton disabled={!isStep2Complete}>Submit Request</SubmitButton>
                            </>
                        )}
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

export function VerificationTab({ userProfile }: { userProfile: UserProfile }) {
     if (userProfile.verificationStatus === 'verified') {
        return (
            <div className="p-4 border rounded-lg bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300">
                <p className="font-semibold">Your personal account is verified.</p>
            </div>
        );
    }
    
    if (userProfile.verificationStatus === 'pending') {
        return (
            <div className="p-4 border rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300">
                <p className="font-semibold">Your verification request is pending review.</p>
            </div>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Account Verification</CardTitle>
                <CardDescription>Request verification for your personal and organizational profiles.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold mb-2">Personal Account</h4>
                    <p className="text-sm text-muted-foreground mb-4">Request a "Verified Scholar" badge for your personal account. This typically requires a manual review process to confirm scholarly credentials.</p>
                    <VerificationDialog userProfile={userProfile} />
                </div>
                
                    <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold mb-2">Organizational Verification</h4>
                    <p className="text-sm text-muted-foreground mb-4">Request verification for a Circle that represents an official institution. This adds a badge of authenticity to the Circle's profile.</p>
                    <Select>
                        <SelectTrigger>
                            <SelectValue placeholder="Select an organization you administer..." />
                        </SelectTrigger>
                        <SelectContent>
                            <p className="p-2 text-xs text-muted-foreground">No organizations found.</p>
                        </SelectContent>
                    </Select>
                    <Button className="mt-2" disabled>Request Organization Verification</Button>
                </div>
            </CardContent>
        </Card>
    )
}

    
