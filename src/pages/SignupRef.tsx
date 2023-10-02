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
  Select,
} from "@mantine/core";
import { z } from "zod";
import { useForm, zodResolver } from "@mantine/form";
import darsiLogo from "../assets/darsi-logo.png";
import { FormEvent, useEffect, useState } from "react";
import { GET_PACKAGES_WITHOUT_FILTER, REGISTER } from "../utils/API_CONSTANT";
import { Link, useNavigate } from "react-router-dom";
import { showNotification } from "@mantine/notifications";
import { useLocalStorage } from "@mantine/hooks";
import { useSearchParams } from "react-router-dom";
import axios from "axios";
export function SignupRef() {
  const [_packages, set_packages] = useState([]);
  let [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [value, setValue] = useLocalStorage({
    key: "user",
  });
  value && navigate("/");
  const API = import.meta.env.VITE_API;
  const form = useForm({
    validate: {
      email: (value) =>
        /^([a-zA-Z0-9_\-\.]+)@([a-zA-Z0-9_\-\.]+)\.([a-zA-z]+)$/.test(value)
          ? null
          : "Invalid email",
      password: (value) =>
        /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/.test(
          value
        )
          ? null
          : "Minimum eight characters, at least one special character, one letter and one number",
      firstname: (value) =>
        !value
          ? "First name is required"
          : /^[a-zA-Z]+$/.test(value)
          ? null
          : "Invalid first name",
      lastname: (value) =>
        !value
          ? "Last name is required"
          : /^[a-zA-Z]+$/.test(value)
          ? null
          : "Invalid last name",
      cpassword: (value, values) =>
        value !== values.password
          ? "Password and Confirm Password must be match"
          : null,
      referral_package: (value: any) =>
        !value ? "please select a Package" : null,
    },
    initialValues: {
      email: "",
      password: "",
      cpassword: "",
      firstname: "",
      lastname: "",
      role: "Referrer",
      referred_by: "",
      referral_package: searchParams.get("package")
        ? searchParams.get("package")
        : undefined,
    },
  });
  useEffect(() => {
    const url = `${API}${GET_PACKAGES_WITHOUT_FILTER}`;
    const options: RequestInit = {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    };
    fetch(url, options)
      .then((res) => {
        return res.json();
      })
      .then((response) => {
        let pac = response?.map((p: any) => ({
          label: p.title,
          value: p._id,
        }));
        set_packages(pac);
      })
      .catch((error) => console.log(error));
  }, []);

  const handleSubmit = async (values: typeof form.values) => {
    // e.preventDefault();
    setLoading(true);
    const url = `${API}${REGISTER}`;
    // const values = form.values;
    const options = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    };
    try {
      const res = await axios.post(url, values, options);
      const data = res.data;
      console.log("🚀 ~ file: SignupRef.tsx:115 ~ handleSubmit ~ data:", res)
      if (res.status === 200 || res.status === 201) {
        console.log(200)
        if (data.paymentToken)
          return window.location.replace(data.paymentToken);
        else {
          window.location.href = "/login";
        }
      } else {
        showNotification({
          autoClose: 5000,
          message: data.message,
          color: "red",
        });
      }
      setLoading(false);
    } catch (error: any) {
      showNotification({
        autoClose: 5000,
        message: error.response.data.message,
        color: "red",
      });
    }
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
        Welcome to Darsi!
      </Title>

      <Paper withBorder shadow="md" p={30} mt={30} radius="md">
        <form onSubmit={form.onSubmit((values) => handleSubmit(values))}>
          <TextInput
            withAsterisk
            label="First Name"
            placeholder="Enter Your First Name"
            {...form.getInputProps("firstname")}
          />
          <TextInput
            withAsterisk
            label="Last Name"
            placeholder="Enter Your Last Name"
            {...form.getInputProps("lastname")}
          />
          <TextInput
            withAsterisk
            label="Email"
            autoComplete="new-email"
            placeholder="Enter Your Email"
            {...form.getInputProps("email")}
          />
          <PasswordInput
            placeholder="Enter Your Password"
            label="Password"
            withAsterisk
            autoComplete="off"
            {...form.getInputProps("password")}
          />
          <PasswordInput
            placeholder="Enter Your Confirm Password"
            label="Confirm Password"
            withAsterisk
            {...form.getInputProps("cpassword")}
          />
          <Select
            withAsterisk
            label="Select Your Package"
            placeholder="Pick one"
            data={_packages}
            required
            {...form.getInputProps("referral_package")}
          />
          <TextInput
            // withAsterisk
            label="Referred by"
            placeholder="Enter Your Referred by"
            {...form.getInputProps("referred_by")}
          />
          <Group position="right" mt="md">
            <Button
              type="button"
              variant="subtle"
              radius="xs"
              size="xs"
              component={Link}
              to="/login"
            >
              Are you already a member? Please login
            </Button>
            <Button
              type="submit"
              loading={loading}
              sx={{
                backgroundColor: "#f85606",
                "&:hover": {
                  backgroundColor: "#f85606",
                  transform: "scale(1.1)",
                },
              }}
            >
              Submit
            </Button>
          </Group>
        </form>
      </Paper>
    </Container>
  );
}
