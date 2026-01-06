import {
  Button,
  TextInput,
  Card,
  Title,
  Stack,
  PasswordInput,
  Text,
} from "@mantine/core";
import { useState } from "react";
import axiosConfig from "../configs/axios";
import axios from "axios";

export default function ChangePassword() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // 🔹 SEND OTP
  const sendOtp = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await axiosConfig.post("/auth/forgot-password", { email });

      if (res.status === 200) {
        setStep(2);
        setMessage("OTP email par bhej diya gaya hai");
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || "OTP send failed");
    } finally {
      setLoading(false);
    }
  };

  // 🔹 VERIFY OTP
  const verifyOtp = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await axiosConfig.post("/auth/verify-otp", { email, otp });

      if (res.status === 200) {
        setStep(3);
        setMessage("OTP verify ho gaya");
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  // 🔹 CHANGE PASSWORD
  const changePassword = async () => {
    if (password !== confirmPassword) {
      return setError("Passwords match nahi kar rahe");
    }

    try {
      setLoading(true);
      setError("");

     

    const res = await axiosConfig.post("/auth/reset-password", {
  email,
  newPassword: password, // ✅ correct key
});


      if (res.status === 200) {
        setMessage("Password successfully change ho gaya");
        setStep(1);
        setEmail("");
        setOtp("");
        setPassword("");
        setConfirmPassword("");
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || "Password change failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card shadow="sm" p="lg" radius="md" withBorder w={400} mx="auto">
      <Title order={3} mb="md">
        Change Password
      </Title>

      {message && <Text color="green">{message}</Text>}
      {error && <Text color="red">{error}</Text>}

      {/* STEP 1 */}
      {step === 1 && (
        <Stack>
          <TextInput
            label="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Button loading={loading} onClick={sendOtp}>
            Send OTP
          </Button>
        </Stack>
      )}

      {/* STEP 2 */}
      {step === 2 && (
        <Stack>
          <TextInput
            label="OTP"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            required
          />
          <Button loading={loading} onClick={verifyOtp}>
            Verify OTP
          </Button>
        </Stack>
      )}

      {/* STEP 3 */}
      {step === 3 && (
        <Stack>
          <PasswordInput
            label="New Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <PasswordInput
            label="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
          <Button loading={loading} onClick={changePassword}>
            Change Password
          </Button>
        </Stack>
      )}
    </Card>
  );
}
