import {
  Avatar,
  Box,
  TextInput,
  Button,
  Center,
  Title,
  FileButton,
  Group,
  Select,
  Text,
  Divider,
  Stack,
  Paper,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { useState, useEffect } from "react";
import { useMutation, useQuery } from "react-query";
import { showNotification } from "@mantine/notifications";
import axiosConfig from "../configs/axios";
import { getFormData } from "../utils/getFormData";

export function Profile() {
  const user = JSON.parse(sessionStorage.getItem("user") || "{}");

  const [profileFile, setProfileFile] = useState<File | null>(null);
  const [profilePreview, setProfilePreview] = useState<string | null>(user.imageURL || null);

  const [paymentFile, setPaymentFile] = useState<File | null>(null);
  const [paymentPreview, setPaymentPreview] = useState<string | null>(null);

  const [packages, setPackages] = useState<{ label: string; value: string; price: number }[]>([]);
  const [selectedPackageIndex, setSelectedPackageIndex] = useState<number | null>(null);

  const hasPendingRequest = user.referral_payment_status === "Pending";

  // Fetch packages
  const { isLoading: packagesLoading } = useQuery(
    "referral-packages",
    async () => {
      const res = await axiosConfig.get("/packages?search=&page=1&limit=50");
      return res.data?.data?.docs || [];
    },
    {
      onSuccess: (data) => {
        const sorted = data.sort((a: any, b: any) => b.price - a.price);
        const formatted = sorted.map((pkg: any) => ({
          label: `${pkg.title} - PKR ${pkg.price}`,
          value: pkg._id,
          price: pkg.price,
        }));
        setPackages(formatted);
      },
    }
  );

  const currentPackageIndex = packages.findIndex((p) => p.value === user.referral_package);

  const availablePackages = packages.map((pkg, idx) => {
    if (
      (selectedPackageIndex === null && idx >= currentPackageIndex) ||
      (selectedPackageIndex !== null && selectedPackageIndex === 0 && idx > selectedPackageIndex)
    ) {
      return { ...pkg, disabled: true };
    }
    return pkg;
  });

  const form = useForm({
    initialValues: {
      _id: user._id,
      firstname: user.firstname || "",
      lastname: user.lastname || "",
      transaction_id: "",
      requested_package: "",
      file: null,
      paymentScreenshot: null,
      request_date: user.request_date || null,
    },
    validate: {
      firstname: (value) => (value.trim().length === 0 ? "First name is required" : null),
      lastname: (value) => (value.trim().length === 0 ? "Last name is required" : null),
      transaction_id: (value, values) =>
        values.requested_package && value.trim().length === 0
          ? "Transaction ID is required when requesting a package"
          : null,
      requested_package: (value) =>
        value.trim().length === 0 ? "Please select a new package" : null,
    },
  });

  // Profile preview
  useEffect(() => {
    if (!profileFile) return;
    const url = URL.createObjectURL(profileFile);
    setProfilePreview(url);
    return () => URL.revokeObjectURL(url);
  }, [profileFile]);

  // Payment preview
  useEffect(() => {
    if (!paymentFile) return;
    const url = URL.createObjectURL(paymentFile);
    setPaymentPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [paymentFile]);

  const { mutate, isLoading } = useMutation({
    mutationKey: ["update-user", user?._id],
    mutationFn: async (values: any) => {
      if (!paymentFile && values.requested_package) {
        throw new Error("Payment screenshot is required!");
      }

      values.file = profileFile;
      values.paymentScreenshot = paymentFile;
      values.referral_payment_status = "Pending";
      values.updatedAt = new Date(); // Automatically set current time

      const formData = getFormData(values);
      const res = await axiosConfig.put("/users/" + user._id, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return res.data;
    },
    onSuccess: (data) => {
      const updatedUser = data?.data;
      if (updatedUser) {
        const currentUser = JSON.parse(sessionStorage.getItem("user") || "{}");
        sessionStorage.setItem("user", JSON.stringify({ ...currentUser, ...updatedUser }));
        showNotification({
          message: "Profile updated and package request is now pending!",
          color: "green",
        });
        form.setFieldValue("updatedAt", new Date());
      }
    },
    onError: (err: any) => {
      showNotification({
        message: err?.response?.data?.message || err.message || "Something went wrong!",
        color: "red",
      });
    },
  });

  return (
    <Box sx={{ maxWidth: 700, margin: "0 auto", padding: "20px" }}>
      <Paper shadow="lg" radius="md" p="xl">
        <Title order={2} mb="lg" align="center">
          Edit Profile & Request Referral Package
        </Title>

        {hasPendingRequest && (
          <Text color="orange" weight={600} align="center" mb="md">
            Your previous package request is pending admin approval.
          </Text>
        )}

        {form.values.request_date && (
          <Text color="blue" align="center" mb="md" size="sm">
            Last request: {new Date(form.values.request_date).toLocaleString()}
          </Text>
        )}

        <form
          onSubmit={form.onSubmit((values) => {
            if (!paymentFile && values.requested_package) {
              showNotification({
                message: "Payment screenshot is required!",
                color: "red",
              });
              return;
            }
            mutate(values);
          })}
        >
          <Stack spacing="lg">
            {/* Profile Avatar */}
            <Group position="center" spacing="md">
              <Avatar
                src={profilePreview || undefined}
                size={120}
                radius="xl"
                styles={(theme) => ({
                  image: { objectFit: "cover" },
                })}
              />
              <FileButton
                onChange={setProfileFile}
                accept="image/png,image/jpeg"
                disabled={hasPendingRequest}
              >
                {(props) => (
                  <Button
                    {...props}
                    variant="gradient"
                    gradient={{ from: "indigo", to: "cyan" }}
                  >
                    Upload Profile
                  </Button>
                )}
              </FileButton>
            </Group>

            <Divider />

            {/* Name Fields */}
            <TextInput
              label="First Name"
              placeholder="Enter first name"
              required
              {...form.getInputProps("firstname")}
              disabled={hasPendingRequest}
            />
            <TextInput
              label="Last Name"
              placeholder="Enter last name"
              required
              {...form.getInputProps("lastname")}
              disabled={hasPendingRequest}
            />

            <Divider />

            {/* Current Package */}
            <TextInput
              label="Current Referral Package"
              value={
                packages.find((p) => p.value === user.referral_package)?.label || "No package"
              }
              disabled
            />

            {/* New Package Select */}
            <Select
              label="Request New Referral Package"
              placeholder="Select package"
              data={availablePackages}
              {...form.getInputProps("requested_package")}
              onChange={(value: string | null) => {
                if (value) {
                  form.setFieldValue("requested_package", value);
                  const idx = packages.findIndex((p) => p.value === value);
                  setSelectedPackageIndex(idx);
                } else {
                  form.setFieldValue("requested_package", "");
                  setSelectedPackageIndex(null);
                }
              }}
              required
              disabled={hasPendingRequest}
            />

            {/* Transaction ID */}
            <TextInput
              label="Transaction ID"
              placeholder="Enter transaction ID"
              required={!!form.values.requested_package}
              {...form.getInputProps("transaction_id")}
              disabled={hasPendingRequest}
            />

            {/* Payment Upload */}
            <Group spacing="sm" align="flex-start">
              <FileButton
                onChange={setPaymentFile}
                accept="image/png,image/jpeg"
                disabled={hasPendingRequest}
              >
                {(props) => (
                  <Button
                    {...props}
                    variant="gradient"
                    gradient={{ from: "teal", to: "lime" }}
                  >
                    Upload Payment Screenshot
                  </Button>
                )}
              </FileButton>
              {paymentPreview && (
                <Avatar
                  src={paymentPreview}
                  alt="Payment"
                  size={60}
                  radius="sm"
                  styles={{ image: { objectFit: "contain" } }}
                />
              )}
            </Group>

            {/* Submit Button */}
            <Center>
              <Button
                type="submit"
                size="md"
                loading={isLoading}
                disabled={hasPendingRequest}
                fullWidth
                variant="gradient"
                gradient={{ from: "grape", to: "pink" }}
              >
                Save Changes & Request Package
              </Button>
            </Center>
          </Stack>
        </form>
      </Paper>
    </Box>
  );
}
