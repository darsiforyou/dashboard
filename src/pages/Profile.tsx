import {
  Avatar,
  Box,
  TextInput,
  Button,
  Center,
  Title,
  FileButton,
  Group,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { useState } from "react";
import { useMutation } from "react-query";
import axiosConfig from "../configs/axios";
import { getFormData } from "../utils/getFormData";

export function Profile() {
  const user = JSON.parse(sessionStorage.getItem("user") || "{}");
  const [file, setFile] = useState<File | null>(null);

  const form = useForm({
    initialValues: {
      _id: user._id,
      firstname: user.firstname,
      lastname: user.lastname,
      email: user.email,
      file: file,
      imageURL: "",
      imageId: "",
      role: user.role,
    },
  });

  const { mutate, isLoading } = useMutation({
    mutationKey: ["update-user", user?._id],
    mutationFn: async (values: any) => {
      values.file = file;
      const formData = getFormData(values);
      const res = await axiosConfig.put("/users/" + user._id, formData);
      const data = res.data;
      return data;
    },
    onSuccess: (data) => {
      let user = data?.data;

      const userL = JSON.parse(sessionStorage.getItem("user") || "");
      const newUser = { ...userL, ...user };
      sessionStorage.setItem("user", JSON.stringify(newUser));
    },
  });
  return (
    <Box>
      <Box maw={600} sx={{ margin: "0 auto" }}>
        <Title order={3} mb="md">
          Edit Profile
        </Title>
        <form onSubmit={form.onSubmit((values) => mutate(values))}>
          <Group>
            <Avatar
              src={file ? URL.createObjectURL(file) : user.imageURL}
              alt={"user image"}
              size={240}
              // sx={{ margin: "0 auto" }}
            />
            <FileButton
              // mx="auto"
              onChange={setFile}
              accept="image/png,image/jpeg"
            >
              {(props) => <Button {...props}>Upload image</Button>}
            </FileButton>
          </Group>

          <TextInput
            label="First Name"
            mb={"md"}
            {...form.getInputProps("firstname")}
          />
          <TextInput
            label="Last Name"
            mb={"md"}
            {...form.getInputProps("lastname")}
          />
          <TextInput label="Email" mb={"md"} {...form.getInputProps("email")} />
          <Center>
            <Button type="submit" loading={isLoading} sx={{ margin: "0 auto" }}>
              Save Changes
            </Button>
          </Center>
        </form>
      </Box>
    </Box>
  );
}
