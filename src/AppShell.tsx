import React, { useEffect, useState } from "react";
import {
  AppShell,
  Header,
  Text,
  MediaQuery,
  Burger,
  useMantineTheme,
  ActionIcon,
  useMantineColorScheme,
  Image,
  Avatar,
  Box,
  Menu,
  CopyButton,
  Tooltip,
  Group,
  Modal,
  FileInput,
  Button,
  Stack,
  Divider,
  Card,
  Title,
  TextInput,
} from "@mantine/core";
import { NavbarSimple } from "./components/Navbar";
import { Sun, MoonStars, Logout, Settings } from "tabler-icons-react";
import darsiIcon from "./assets/darsi-logo.png";
import { Link, Outlet, useLocation } from "react-router-dom";
import { IconCheck, IconCopy } from "@tabler/icons";
import { useQuery, useMutation } from "react-query";
import axiosConfig from "./configs/axios";
import { showNotification } from "@mantine/notifications";
import { USERS } from "./utils/API_CONSTANT";

export default function ApplicationShell() {
  const theme = useMantineTheme();
  const [opened, setOpened] = useState(false);
  const [mdOpened, setMdOpened] = useState(true);
  const { pathname } = useLocation();

  useEffect(() => {
    setOpened(false); // Close navigation on route change
  }, [pathname]);

  const { colorScheme, toggleColorScheme } = useMantineColorScheme();
  const dark = colorScheme === "dark";

  const user = JSON.parse(sessionStorage.getItem("user") || "{}");

  const { data: refPackage, isFetching } = useQuery({
    queryKey: ["package", user.referral_package],
    queryFn: async () => {
      const res = await axiosConfig("/packages/" + user.referral_package);
      return res.data;
    },
    refetchOnWindowFocus: false,
  });

  // Modal & payment state
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [transactionId, setTransactionId] = useState(""); // Transaction ID input
  const [paymentScreenshot, setPaymentScreenshot] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const handleFileChange = (file: File | null) => {
    if (file && !file.type.startsWith("image/")) {
      showNotification({
        title: "Invalid File",
        message: "Please select a valid image file.",
        color: "red",
      });
      return;
    }
    setPaymentScreenshot(file);
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setPreviewImage(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      setPreviewImage(null);
    }
  };

  // Mutation to submit payment screenshot
  const submitPayment = useMutation(
    async () => {
      if (!transactionId || transactionId.trim().length < 5) {
        throw new Error("Transaction ID is required (min 5 characters).");
      }
      if (!paymentScreenshot) {
        throw new Error("Please upload payment screenshot.");
      }


   const formData = new FormData();
   formData.append("transaction_id", transactionId);
   formData.append("paymentScreenshot", paymentScreenshot);

   const res = await axiosConfig.put(
  USERS + "/" + user._id,
  formData,
  { headers: { "Content-Type": "multipart/form-data" } }
);

      return res.data;
    },
    {
      onSuccess: () => {
        showNotification({
          title: "Success",
          message: "Payment submitted successfully!",
          color: "green",
          icon: <IconCheck />,
        });
        setIsPaymentModalOpen(false);
        setTransactionId("");
        setPaymentScreenshot(null);
        setPreviewImage(null);
      },
      onError: (err: any) => {
        showNotification({
          title: "Error",
          message: err?.message || "Failed to submit payment.",
          color: "red",
        });
      },
    }
  );

  const handleUnpaidClick = () => setIsPaymentModalOpen(true);

  // Company bank details
  const companyBank = {
    name: "Darsi Pvt Ltd",
    accountNumber: "1234567890",
    bankName: "National Bank",
    branch: "Main Branch",
    ifsc: "NATB0001234",
  };

  return (
    <AppShell
      styles={{
        main: {
          background: dark ? theme.colors.dark[8] : theme.colors.gray[0],
        },
      }}
      navbarOffsetBreakpoint="sm"
      asideOffsetBreakpoint="sm"
      fixed
      navbar={mdOpened ? <NavbarSimple opened={opened} /> : undefined}
      header={
        <Header height={70} p="md">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: "100%" }}>
            <div style={{ display: "flex", alignItems: "center" }}>
              <MediaQuery smallerThan="sm" styles={{ display: "none" }}>
                <Burger opened={mdOpened} onClick={() => setMdOpened((o) => !o)} size="sm" color={theme.colors.gray[6]} mr="xl" />
              </MediaQuery>
              <MediaQuery largerThan="sm" styles={{ display: "none" }}>
                <Burger opened={opened} onClick={() => { setOpened(!opened); setMdOpened(true); }} size="sm" color={theme.colors.gray[6]} mr="xl" />
              </MediaQuery>
              <Link to="/"><Image src={darsiIcon} alt="Darsi logo" width={60} /></Link>
            </div>

            <div style={{ display: "flex", alignItems: "center" }}>
              {user.role === "Referrer" && (
                <Box sx={{ display: "flex", marginRight: 20, alignItems: "center" }}>
                  {(!user.transaction_id || user.transaction_id.length <= 5) && !user.referral_payment_status ? (
                    <Text color="red" weight={600} style={{ cursor: "pointer" }} onClick={handleUnpaidClick}>
                      UNPAID
                    </Text>
                  ) : user.transaction_id?.length > 5 && !user.referral_payment_status ? (
                    <Text>Verification In Process</Text>
                  ) : (
                    <Text>{user.user_code}</Text>
                  )}

                  {user.referral_payment_status && (
                    <CopyButton value={user.user_code} timeout={2000}>
                      {({ copied, copy }) => (
                        <Tooltip label={copied ? "Copied" : "Copy"} withArrow position="right">
                          <ActionIcon color={copied ? "teal" : "gray"} onClick={copy}>
                            {copied ? <IconCheck size={16} /> : <IconCopy size={16} />}
                          </ActionIcon>
                        </Tooltip>
                      )}
                    </CopyButton>
                  )}
                </Box>
              )}

              {/* <ActionIcon variant="outline" color={dark ? "yellow" : "blue"} onClick={toggleColorScheme} mr="xs">
                {dark ? <Sun size={18} /> : <MoonStars size={18} />}
              </ActionIcon> */}

              <Menu>
                <Menu.Target>
                  <Box sx={{ display: "flex", alignItems: "center", cursor: "pointer" }}>
                    <Avatar src={user.imageURL} radius="xl" mr="md" />
                    <Box>
                      <Text>{user.firstname} {user.lastname}</Text>
                      <Group spacing={5}><Text size="xs">{user.role}</Text></Group>
                    </Box>
                  </Box>
                </Menu.Target>
                <Menu.Dropdown>
                  <Menu.Item component={Link} to="profile" icon={<Settings size={14} />}>Profile</Menu.Item>
                  <Menu.Item icon={<Logout size={14} />} onClick={() => { sessionStorage.clear(); window.location.href = "/login"; }}>Logout</Menu.Item>
                </Menu.Dropdown>
              </Menu>
            </div>
          </div>
        </Header>
      }
    >
      <Outlet />

      {/* Payment Modal */}
      <Modal opened={isPaymentModalOpen} onClose={() => setIsPaymentModalOpen(false)} title="Verify & Upload Payment" size="md">
        <Stack spacing="sm">
          <Text weight={500}>Verify your information before making payment:</Text>
          <Divider />

          <Card shadow="sm" radius="md" withBorder>
            <Title order={6}>Your Information</Title>
            <Text><b>Name:</b> {user.firstname} {user.lastname}</Text>
            <Text><b>Email:</b> {user.email}</Text>
            <Text><b>Role:</b> {user.role}</Text>
            {user.role === "Referrer" && <Text><b>Referral Code:</b> {user.user_code}</Text>}
            {user.role === "Referrer" && <Text><b>Package:</b> {!isFetching ? refPackage?.title : "Loading"}</Text>}
            {user.role === "Referrer" && <Text><b>Amount:</b> {!isFetching ? refPackage?.price : "Loading"}</Text>}
          </Card>

          <Card shadow="sm" radius="md" withBorder>
            <Title order={6}>Company Bank Details</Title>
            <Text><b>Bank Name:</b> {companyBank.bankName}</Text>
            <Text><b>Branch:</b> {companyBank.branch}</Text>
            <Text><b>Account Number:</b> {companyBank.accountNumber}</Text>
            <Text><b>IFSC:</b> {companyBank.ifsc}</Text>
          </Card>

          <Divider />
          <Text>Enter your Transaction ID and upload screenshot:</Text>

          <TextInput
            label="Transaction ID"
            placeholder="Enter your transaction ID"
            value={transactionId}
            onChange={(e) => setTransactionId(e.currentTarget.value)}
            required
          />

          <FileInput
            placeholder="Select screenshot"
            label="Payment Screenshot"
            accept="image/*"
            value={paymentScreenshot}
            onChange={handleFileChange}
            required
          />

          {previewImage && (
            <Box style={{ position: "relative" }}>
              <Image src={previewImage} alt="Preview" height={200} fit="contain" radius="md" />
              <Button variant="outline" color="red" size="xs" style={{ position: "absolute", top: 5, right: 5 }} onClick={() => { setPaymentScreenshot(null); setPreviewImage(null); }}>
                Delete
              </Button>
            </Box>
          )}

          <Button fullWidth mt="md" onClick={() => submitPayment.mutate()} loading={submitPayment.isLoading}>
            Submit Payment
          </Button>
        </Stack>
      </Modal>
    </AppShell>
  );
}
