import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

// OTP flow replaced with email/password login.
// This page redirects to the login page.
export default function OTPVerification() {
  const navigate = useNavigate();
  useEffect(() => {
    navigate(createPageUrl("PhoneInput"), { replace: true });
  }, [navigate]);
  return null;
}
