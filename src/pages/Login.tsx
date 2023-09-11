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
import { AUTH_URL } from "../utils/API_CONSTANT";
import { Link, useNavigate } from "react-router-dom";
import { showNotification } from "@mantine/notifications";
import { useLocalStorage, useSessionStorage } from "@mantine/hooks";

const schema = z.object({
  password: z
    .string()
    .min(2, { message: "Name should have at least 2 letters" }),
  email: z.string().email({ message: "Invalid email" }),
});
export function Login() {
  const navigate = useNavigate();
  localStorage.clear();

  const [value, setValue] = useSessionStorage({
    key: "user",
  });
  value && navigate("/");
  // useLayoutEffect(() => {
  // }, [value]);
  const [loading, setLoading] = useState(false);
  const API = import.meta.env.VITE_API;
  const form = useForm({
    validate: zodResolver(schema),
    initialValues: {
      email: "",
      password: "",
    },
  });
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const url = `${API}${AUTH_URL}`;
    const values = form.values;
    const options: RequestInit = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(values),
    };
    await fetch(url, options)
      .then((res) => {
        return res.json();
      })
      .then(({ data, message }) => {
        if (data?._id) {
          if (data?.role === "Customer") {
            return showNotification({
              autoClose: 5000,
              // title: "Image not selected",
              message: "You are not Authorized",
              color: "orange",
            });
          }
          let user = JSON.stringify(data);
          sessionStorage.setItem("user", user);
          window.location.href = "/";
          setLoading(false);
        } else {
          showNotification({
            autoClose: 5000,
            // title: "Image not selected",
            message,
            color: "red",
          });
          setLoading(false);
        }
      })
      .catch((error) => console.log(error));
  };

  return (
    <Container size={420} my={40}>
      <Center>
        <Image width={200} src={darsiLogo} />
      </Center>
      <Title
        align="center"
        sx={(theme) => ({
          fontFamily: `Greycliff CF, ${theme.fontFamily}`,
          fontWeight: 900,
        })}
      >
        Welcome back!
      </Title>

      <Paper withBorder shadow="md" p={30} mt={30} radius="md">
        <form onSubmit={handleSubmit}>
          <TextInput
            label="Email"
            placeholder="you@mantine.dev"
            {...form.getInputProps("email")}
            required
          />
          <PasswordInput
            label="Password"
            placeholder="Your password"
            required
            mt="md"
            {...form.getInputProps("password")}
          />
          <Group position="apart" mt="md">
            <Checkbox label="Remember me" />
            <Anchor<"a">
              onClick={(event) => event.preventDefault()}
              href="#"
              size="sm"
            >
              Forgot password?
            </Anchor>
          </Group>

          <Button loading={loading} type="submit" fullWidth mt="xl">
            Sign in
          </Button>
        </form>
      </Paper>
    </Container>
  );
}
