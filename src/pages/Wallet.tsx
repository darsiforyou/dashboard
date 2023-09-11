import {
  ActionIcon,
  Box,
  Button,
  Flex,
  Group,
  Modal,
  NumberInput,
  TextInput,
  Title,
} from "@mantine/core";
import { useForm, zodResolver } from "@mantine/form";
import { showNotification } from "@mantine/notifications";
import { DataTable } from "mantine-datatable";
import React, { useState } from "react";
import { useMutation, useQuery } from "react-query";
import { Edit, Trash } from "tabler-icons-react";
import { z } from "zod";
import { ConfirmModal } from "../components/ConfirmModal";
import axiosConfig from "../configs/axios";

const schema = z.object({
  minAmount: z.number(),
});

type Wallet = z.infer<typeof schema>;
export default function Wallet() {
  const [isAddModalOpened, setIsAddModalOpened] = useState(false);
  const [opened, setOpened] = useState(false);
  const form = useForm({
    validate: zodResolver(schema),
    initialValues: {
      _id: "",
      minAmount: null,
    },
  });
  const [deleteWallet, setdeleteWallet] = useState<typeof form.values | null>(
    null
  );
  const { data, isFetching, refetch } = useQuery({
    queryKey: ["wallets"],
    queryFn: async () => {
      const res = await axiosConfig.get("/wallets");
      const data = await res.data;
      return data;
    },
  });
  const { mutate: addMutation, isLoading: addWalletLoading } = useMutation({
    mutationKey: ["addWallet"],
    mutationFn: async (values: typeof form.values) => {
      const res = await axiosConfig.post("/wallets", values);
      const data = res.data;
      return data;
    },
    onSuccess: (data) => {
      showNotification({
        message: data.message,
      });
      setIsAddModalOpened(false);
      refetch();
    },
  });
  const { mutate: editMutation, isLoading: editWalletLoading } = useMutation({
    mutationKey: ["addWallet"],
    mutationFn: async (values: typeof form.values) => {
      const res = await axiosConfig.put("/wallets/" + values._id, values);
      const data = res.data;
      return data;
    },
    onSuccess: (data) => {
      showNotification({
        message: data.message,
      });
      setIsAddModalOpened(false);
      refetch();
    },
  });
  function handleSubmit(values: typeof form.values) {
    if (values._id) {
      editMutation(values);
      return;
    }
    addMutation(values);
  }
  const handleOpenModal = (data: any = {}) => {
    setIsAddModalOpened(true);
    if (data._id) {
      form.setValues(data);
    }
  };
  return (
    <Box>
      <Flex mb="lg" justify={"space-between"}>
        <Title>Wallet</Title>
        <Button onClick={() => setIsAddModalOpened(true)}>Add</Button>
      </Flex>
      <Box>
        <DataTable
          fetching={isFetching}
          striped
          highlightOnHover
          withBorder
          withColumnBorders
          records={data?.data}
          columns={[
            {
              accessor: "index",
              title: "#",
              textAlignment: "right",
              width: 40,
              render: (record) => data?.data?.indexOf(record) + 1,
            },
            {
              accessor: "minAmount",
            },

            {
              accessor: "actions",
              render: (record: any) => (
                <>
                  <Group spacing={4} noWrap>
                    <ActionIcon
                      color="blue"
                      component="button"
                      onClick={(e) => {
                        //  e.stopPropagation();
                        handleOpenModal(record);
                      }}
                    >
                      <Edit size={18} />
                    </ActionIcon>
                    <ActionIcon
                      color="red"
                      component="button"
                      onClick={() => {
                        setOpened(true), setdeleteWallet(record);
                      }}
                    >
                      <Trash size={18} />
                    </ActionIcon>
                  </Group>
                </>
              ),
            },
          ]}
        />
      </Box>
      <Modal
        opened={isAddModalOpened}
        onClose={() => {
          setIsAddModalOpened(false);

          form.reset();
        }}
        title={
          form.values._id ? "Update Subject Details" : "Add Subject Details"
        }
        size="lg"
      >
        <form onSubmit={form.onSubmit((values) => handleSubmit(values))}>
          <NumberInput
            label="Darsi City Price"
            placeholder="100"
            required
            {...form.getInputProps("minAmount")}
          />
          <Button
            loading={addWalletLoading || editWalletLoading}
            type="submit"
            fullWidth
            my={"sm"}
          >
            Submit
          </Button>
        </form>
      </Modal>
      <ConfirmModal
        opened={opened}
        _id={deleteWallet?._id}
        apiPoint={"/wallets"}
        refetch={refetch}
        title={`Are you sure you want to delete?`}
        onClose={() => {
          setOpened(false), setdeleteWallet(null);
        }}
      />
    </Box>
  );
}
