import {
  TextInput,
  PasswordInput,
  Checkbox,
  Anchor,
  Paper,
  Title,
  Container,
  Group,
  Button,
  Image,
  Center,
} from "@mantine/core";
import { z } from "zod";
import { useForm, zodResolver } from "@mantine/form";
import darsiLogo from "../assets/darsi-logo.png";
import { FormEvent, useState } from "react";
import { showNotification } from "@mantine/notifications";
import { useSessionStorage } from "@mantine/hooks";
import { AUTH_URL, FORGOT_PASSWORD_URL, VERIFY_OTP_URL, RESET_PASSWORD_URL } from "../utils/API_CONSTANT";

export function Login() {
  const API = import.meta.env.VITE_API;
  const [value, setValue] = useSessionStorage({ key: "user" });
  const [loading, setLoading] = useState(false);
  const [forgotPasswordStep, setForgotPasswordStep] = useState<"email" | "verify" | "reset" | null>(null);

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const loginSchema = z.object({
    email: z.string().email({ message: "Invalid email" }),
    password: z.string().min(2, { message: "Password should be at least 2 characters" }),
  });

  const forgotSchema = z.object({
    email: z.string().email({ message: "Invalid email" }),
  });

  const loginForm = useForm({
    validate: zodResolver(loginSchema),
    initialValues: { email: "", password: "" },
  });

  const forgotForm = useForm({
    validate: zodResolver(forgotSchema),
    initialValues: { email: "" },
  });

  // ------------------ LOGIN ------------------
  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await fetch(`${API}${AUTH_URL}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(loginForm.values),
    });
    const { data, message } = await res.json();
    if (data?._id) {
      if (data.role === "Customer") {
        showNotification({ message: "You are not Authorized", color: "orange", autoClose: 5000 });
      } else {
        sessionStorage.setItem("user", JSON.stringify(data));
        window.location.href = "/";
      }
    } else {
      showNotification({ message, color: "red", autoClose: 5000 });
    }
    setLoading(false);
  };

  // ------------------ SEND OTP ------------------
  const handleSendOtp = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${API}${FORGOT_PASSWORD_URL}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotForm.values.email }),
      });
      const data = await res.json();
      if (res.ok) {
        showNotification({ message: data.message, color: "green" });
        setEmail(forgotForm.values.email);
        setForgotPasswordStep("verify");
      } else {
        showNotification({ message: data.message, color: "red" });
      }
    } catch (err) {
      console.error(err);
      showNotification({ message: "Server error", color: "red" });
    }
    setLoading(false);
  };

  // ------------------ VERIFY OTP ------------------
  const handleVerifyOtp = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${API}${VERIFY_OTP_URL}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });
      const data = await res.json();
      if (res.ok) {
        showNotification({ message: data.message, color: "green" });
        setForgotPasswordStep("reset");
      } else {
        showNotification({ message: data.message, color: "red" });
      }
    } catch (err) {
      console.error(err);
      showNotification({ message: "Server error", color: "red" });
    }
    setLoading(false);
  };

  // ------------------ RESET PASSWORD ------------------
  const handleResetPassword = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${API}${RESET_PASSWORD_URL}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
       body: JSON.stringify({
    email: email,       // exact same as OTP email
    otp: otp,           // exact OTP from email
    newPassword: newPassword
  }),

        

      });





      const data = await res.json();
      if (res.ok) {
        showNotification({ message: data.message, color: "green" });
        setForgotPasswordStep(null);
        forgotForm.reset();
        setOtp("");
        setNewPassword("");
      } else {
        showNotification({ message: data.message, color: "red" });
      }
    } catch (err) {
      console.error(err);
      showNotification({ message: "Server error", color: "red" });
    }
    setLoading(false);
  };

  return (
    <Container size={420} my={40}>
      <Center>
        <Image width={200} src={darsiLogo} />
      </Center>
      <Title align="center" sx={(theme) => ({ fontFamily: `Greycliff CF, ${theme.fontFamily}`, fontWeight: 900 })}>
        {forgotPasswordStep ? "Forgot Password" : "Welcome back!"}
      </Title>

      <Paper withBorder shadow="md" p={30} mt={30} radius="md">
        {/* ------------------ LOGIN FORM ------------------ */}
        {!forgotPasswordStep && (
          <form onSubmit={handleLogin}>
            <TextInput label="Email" placeholder="you@mantine.dev" {...loginForm.getInputProps("email")} required />
            <PasswordInput label="Password" placeholder="Your password" mt="md" {...loginForm.getInputProps("password")} required />
            <Group position="apart" mt="md">
              <Checkbox label="Remember me" />
              <Anchor<"a"> onClick={() => setForgotPasswordStep("email")} size="sm" style={{ cursor: "pointer" }}>
                Forgot password?
              </Anchor>
            </Group>
            <Button loading={loading} type="submit" fullWidth mt="xl">
              Sign in
            </Button>
          </form>
        )}

        {/* ------------------ FORGOT PASSWORD FORM ------------------ */}
        {forgotPasswordStep === "email" && (
          <form onSubmit={handleSendOtp}>
            <TextInput label="Email" placeholder="you@mantine.dev" {...forgotForm.getInputProps("email")} required />
            <Button loading={loading} type="submit" fullWidth mt="xl">
              Send OTP
            </Button>
            <Group position="center" mt="md">
              <Anchor<"a"> onClick={() => setForgotPasswordStep(null)} style={{ cursor: "pointer" }}>
                Back to Login
              </Anchor>
            </Group>
          </form>
        )}

        {forgotPasswordStep === "verify" && (
          <form onSubmit={handleVerifyOtp}>
            <TextInput label="OTP" placeholder="Enter OTP" value={otp} onChange={(e) => setOtp(e.target.value)} required />
            <Button loading={loading} type="submit" fullWidth mt="xl">
              Verify OTP
            </Button>
          </form>
        )}

        {forgotPasswordStep === "reset" && (
          <form onSubmit={handleResetPassword}>
            <PasswordInput
              label="New Password"
              placeholder="Enter new password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
            <Button loading={loading} type="submit" fullWidth mt="xl">
              Reset Password
            </Button>
          </form>
        )}
      </Paper>
    </Container>
  );
}
