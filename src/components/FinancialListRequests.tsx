import {
  Button,
  createStyles,
  Modal,
  TextInput,
  Title,
  SimpleGrid,
  useMantineTheme,
  Checkbox,
  Image,
  Drawer,
  Input,
  Switch,
  Select,
  ActionIcon,
  Group,
  Box,
  Tabs,
  Text,
  NumberInput,
  Card,
  Stack,
} from "@mantine/core";
import { FormEvent, useEffect, useState } from "react";
import { TbPlus } from "react-icons/tb";
import { z } from "zod";
import { useForm, zodResolver } from "@mantine/form";
import axiosConfig from "../configs/axios";
import { FINANCIALS } from "../utils/API_CONSTANT";
import { AxiosResponse } from "axios";
import { getFormData } from "../utils/getFormData";
import { useQuery } from "react-query";
// import { DataTable } from "primereact/datatable";
import { DataTable } from "mantine-datatable";
import { Column } from "primereact/column";
import { Pencil, Trash, Search, Filter, Edit, Check } from "tabler-icons-react";
import placeholder from "../assets/placeholder.png";
import { showNotification } from "@mantine/notifications";
import { IconCheck } from "@tabler/icons";
import { ConfirmModal } from "../components/ConfirmModal";
import { format } from "fecha";

const schema = z.object({
  _id: z.string(),
  user: z.any(),
  order: z.any(),
  amount: z.number(),
  amountWithdraw: z.number(),
  status: z.string(),
});

const useStyles = createStyles((theme) => ({
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "start",
    width: "100%",
  },
}));

type Financial = z.infer<typeof schema>;

const fetchTableData = async ({ queryKey }: any) => {
  const [_, { page, limit, ...filters }] = queryKey;
  const params = new URLSearchParams(filters);
  const res: AxiosResponse = await axiosConfig.get(
    `${FINANCIALS}/requests?page=${page}&limit=${limit}&${params}`
  );
  const data = res.data;
  return data;
};

interface Props {
  tabChange: boolean;
  paymentRequest: boolean;
  activeTab?: string;
}

export function FinancialListRequest({
  tabChange,
  paymentRequest,
  activeTab = "All",
}: Props) {
  const user = JSON.parse(sessionStorage.getItem("user") || "{}");
  const [acceptModal, setAcceptModal] = useState(false);
  const [acceptRequest, setAcceptRequest]: any = useState({});
  const [opened, setOpened] = useState(false);
  const [deleteRequest, setDeleteRequest] = useState<any>(null);
  const [filters, setfilters] = useState({
    limit: 10,
    page: 1,
    user: user.role === "Admin" ? "" : user._id,
    darsi: "",
    status: "",
  });

  const {
    isLoading,
    error,
    data: financials,
    refetch,
  } = useQuery(["financials", filters], fetchTableData, {
    enabled: true,
    refetchOnWindowFocus: true,
  });
  useEffect(() => {
    refetch();
  }, [tabChange, paymentRequest]);

  const { classes } = useStyles();
  const onPagination = async (event: any) => {
    await setfilters((prev: any) => ({
      ...prev,
      // limit: event.rows,
      page: event,
    }));
    await refetch();
  };
  const handleAcceptRequest = async (data: any) => {
    await axiosConfig
      .get(
        FINANCIALS +
          "/accept-payment-request/" +
          data._id +
          "?amount=" +
          data.amountAccepted
      )
      .then(async (res) => {
        if (res?.status === 200) {
          await refetch();
          setAcceptModal(false);
          setAcceptRequest({});
          showNotification({
            title: "Success",
            message: res.data.message,
            icon: <IconCheck />,
            color: "teal",
          });
        } else {
          showNotification({
            title: "Failed",
            message: res.data.message,
            icon: <IconCheck />,
            color: "red",
          });
        }
      });
  };
  return (
    <>
      <Tabs
        defaultValue={activeTab}
        onTabChange={(value) => {
          setfilters((prev: any) => ({
            ...prev,
            status: value === "All" ? "" : value,
          }));
        }}
      >
        <Tabs.List>
          <Tabs.Tab value="All">All</Tabs.Tab>
          <Tabs.Tab value="Pending">Pending</Tabs.Tab>
          <Tabs.Tab value="Accepted">Accepted</Tabs.Tab>
          <Tabs.Tab value="Rejected">Rejected</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="All" pt="xs">
          <Datatable
            financials={financials}
            setOpened={setOpened}
            setDeleteRequest={setDeleteRequest}
            setAcceptRequest={setAcceptRequest}
            setAcceptModal={setAcceptModal}
            onPagination={onPagination}
            filters={filters}
            isLoading={isLoading}
            user={user}
          />
        </Tabs.Panel>
        <Tabs.Panel value="Pending" pt="xs">
          <Datatable
            financials={financials}
            setOpened={setOpened}
            setDeleteRequest={setDeleteRequest}
            setAcceptRequest={setAcceptRequest}
            setAcceptModal={setAcceptModal}
            onPagination={onPagination}
            filters={filters}
            isLoading={isLoading}
            user={user}
          />
        </Tabs.Panel>
        <Tabs.Panel value="Rejected" pt="xs">
          <Datatable
            financials={financials}
            setOpened={setOpened}
            setDeleteRequest={setDeleteRequest}
            setAcceptRequest={setAcceptRequest}
            setAcceptModal={setAcceptModal}
            onPagination={onPagination}
            filters={filters}
            isLoading={isLoading}
            user={user}
          />
        </Tabs.Panel>
        <Tabs.Panel value="Accepted" pt="xs">
          <Datatable
            financials={financials}
            setOpened={setOpened}
            setDeleteRequest={setDeleteRequest}
            setAcceptRequest={setAcceptRequest}
            setAcceptModal={setAcceptModal}
            onPagination={onPagination}
            filters={filters}
            isLoading={isLoading}
            user={user}
          />
        </Tabs.Panel>
      </Tabs>

      <Modal
        opened={acceptModal}
        onClose={() => setAcceptModal(false)}
        size={600}
        withCloseButton={true}
        title="Payment Request"
      >
        <Box component="div">
          <Text>Request Amount: {acceptRequest.amountRequested}</Text>
        </Box>
        <Box component="div">
          <NumberInput
            label="Amount"
            mb={12}
            value={acceptRequest.amountAccepted}
            onChange={(e: number) =>
              setAcceptRequest((prev: any) => ({ ...prev, amountAccepted: e }))
            }
          />
          <Button
            sx={{ width: "100%" }}
            color="teal"
            onClick={() => handleAcceptRequest(acceptRequest)}
            disabled={
              acceptRequest.amountAccepted > acceptRequest.amountRequested
            }
          >
            Confirm
          </Button>
        </Box>
      </Modal>

      <ConfirmModal
        opened={opened}
        _id={deleteRequest?._id}
        apiPoint={FINANCIALS + "/reject-payment-request"}
        refetch={refetch}
        title={"Are you sure you want to reject this Request?"}
        onClose={() => {
          setOpened(false), setDeleteRequest(null);
        }}
      >
        <Title mt={0} p={0} mb={"xl"} order={4}></Title>
      </ConfirmModal>
    </>
  );
}

const Datatable = ({
  financials,
  onPagination,
  filters,
  isLoading,
  user,
  setAcceptModal,
  setAcceptRequest,
  setDeleteRequest,
  setOpened,
}: any) => {
  return (
    <Box sx={{ height: "70vh" }}>
      <DataTable
        withBorder
        withColumnBorders
        striped
        highlightOnHover
        page={financials?.data?.page}
        onPageChange={onPagination}
        totalRecords={financials?.data?.totalDocs}
        recordsPerPage={filters.limit}
        idAccessor="_id"
        fontSize="sm"
        records={financials?.data?.docs}
        fetching={isLoading}
        columns={[
          {
            accessor: "index",
            title: "#",
            textAlignment: "right",
            width: 40,
            render: (record) => financials?.data?.docs.indexOf(record) + 1,
          },
          {
            accessor: "user",
            render: ({ user, darsi }: any) => (
              <>
                {!darsi
                  ? user.length > 0
                    ? user[0].firstname + " " + user[0].lastname
                    : "Not Assign"
                  : "Darsi"}
              </>
            ),
          },
          {
            accessor: "role",
            render: ({ user, darsi }: any) => (
              <>
                {!darsi
                  ? user.length > 0
                    ? user[0].role
                    : "Not Assign"
                  : "Admin"}
              </>
            ),
          },
          {
            accessor: "account",
            render: (record: any) => <>{record?.account[0]?.title}</>,
          },
          {
            accessor: "accountType",
            render: (record: any) => <>{record?.account[0]?.type}</>,
          },
          {
            accessor: "amountRequested",
          },
          {
            accessor: "amountAccepted",
          },
          {
            accessor: "status",
          },
          {
            accessor: "createdAt",
            render: ({ createdAt }: any) => (
              <>{format(new Date(createdAt), "DD-MMM-YY")}</>
            ),
          },
          {
            accessor: "actions",
            hidden: user.role !== "Admin",
            render: (record: Financial) => (
              <>
                <Group spacing={4} noWrap>
                  {record.status === "Pending" && (
                    <>
                      <ActionIcon
                        color="green"
                        component="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setAcceptModal(true);
                          setAcceptRequest(record);
                        }}
                      >
                        <Check size={18} />
                      </ActionIcon>
                      <ActionIcon
                        color="red"
                        variant="light"
                        component="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpened(true), setDeleteRequest(record);
                        }}
                      >
                        <Trash size={18} />
                      </ActionIcon>
                    </>
                  )}
                </Group>
              </>
            ),
          },
        ]}
        rowExpansion={{
          content: ({ record }: any) => (
            <Stack p="xs" spacing={6}>
              <Group spacing={6}>
                <Text weight={700}>Account Title:</Text>
                <Text>{record?.account[0]?.title}</Text>
              </Group>
              <Group spacing={6}>
                <Text weight={700}>Account Number:</Text>
                <Text>{record?.account[0]?.account_number}</Text>
              </Group>
              {record?.account[0]?.type === "Bank" && (
                <>
                  <Group spacing={6}>
                    <Text weight={700}>Bank:</Text>
                    <Text>{record?.account[0]?.bankName}</Text>
                  </Group>
                  <Group spacing={6}>
                    <Text weight={700}>IBAN:</Text>
                    <Text>{record?.account[0]?.iban}</Text>
                  </Group>
                </>
              )}
            </Stack>
          ),
        }}
      />
    </Box>
  );
};
