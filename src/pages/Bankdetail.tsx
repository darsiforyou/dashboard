import {
  Card,
  TextInput,
  Button,
  Group,
  Text,
  LoadingOverlay,
  Title,
  Divider,
} from "@mantine/core";
import { useEffect, useState } from "react";
import { showNotification } from "@mantine/notifications";
import axios from "axios";
import axiosConfig from "../configs/axios";

interface BankForm {
  bankName: string;
  accountTitle: string;
  iban: string;
  accountNumber: string;
}

const BankDetails = () => {
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [bank, setBank] = useState<BankForm & { _id?: string } | null>(null);

  const [form, setForm] = useState<BankForm>({
    bankName: "",
    accountTitle: "",
    iban: "",
    accountNumber: "",
  });

  // 🔹 Fetch active bank detail
  const getBankDetails = async () => {
    setLoading(true);
    try {
      const res = await axiosConfig.get("/bank-details");
      if (res.data?.data) {
        setBank(res.data.data);
        setForm({
          bankName: res.data.data.bankName || "",
          accountTitle: res.data.data.accountTitle || "",
          iban: res.data.data.iban || "",
          accountNumber: res.data.data.accountNumber || "",
        });
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => {
    getBankDetails();
  }, []);

  // 🔹 Input handler
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // 🔹 Save (Create / Update)
  const handleSubmit = async () => {
    setLoading(true);
    try {
      let res;
      if (bank?._id) {
        res = await axiosConfig.put(`/bank-details/${bank._id}`, form);
      } else {
        res = await axiosConfig.post(`/bank-details`, form);
      }

      showNotification({
        title: "Success",
        message: res.data.message || "Bank details saved",
        color: "teal",
      });

      setEditMode(false);
      getBankDetails();
    } catch (err: any) {
      showNotification({
        title: "Error",
        message: err.response?.data?.message || "Something went wrong",
        color: "red",
      });
    }
    setLoading(false);
  };

  return (
    <Card shadow="sm" radius="md" p="lg" withBorder style={{ maxWidth: 600 }}>
      <LoadingOverlay visible={loading} />

      <Group position="apart" mb="xs">
        <Title order={4}>Company Bank Details</Title>
        <Button size="xs" onClick={() => setEditMode(!editMode)}>
          {editMode ? "Cancel" : bank ? "Edit" : "Add"}
        </Button>
      </Group>

      <Divider mb="md" />

      {!editMode ? (
        <>
          <Text>
            <b>Bank Name:</b> {bank?.bankName || "-"}
          </Text>
          <Text>
            <b>Account Title:</b> {bank?.accountTitle || "-"}
          </Text>
          <Text>
            <b>IBAN:</b> {bank?.iban || "-"}
          </Text>
          <Text>
            <b>Account Number:</b> {bank?.accountNumber || "-"}
          </Text>

          {!bank && (
            <Text color="dimmed" mt="sm">
              No bank details added yet.
            </Text>
          )}
        </>
      ) : (
        <>
          <TextInput
            label="Bank Name"
            name="bankName"
            value={form.bankName}
            onChange={handleChange}
            required
          />
          <TextInput
            mt="sm"
            label="Account Title"
            name="accountTitle"
            value={form.accountTitle}
            onChange={handleChange}
            required
          />
          <TextInput
            mt="sm"
            label="IBAN"
            name="iban"
            value={form.iban}
            onChange={handleChange}
            required
          />
          <TextInput
            mt="sm"
            label="Account Number"
            name="accountNumber"
            value={form.accountNumber}
            onChange={handleChange}
            required
          />

          <Button fullWidth mt="md" onClick={handleSubmit}>
            Save Bank Details
          </Button>
        </>
      )}
    </Card>
  );
};

export default BankDetails;
