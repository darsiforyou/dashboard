import {
  Button,
  createStyles,
  Modal,
  Image,
  TextInput,
  Title,
  SimpleGrid,
  useMantineTheme,
  Select,
  Drawer,
  Box,
  Group,
  ActionIcon,
} from "@mantine/core";
import { FormEvent, useEffect, useState } from "react";
import { TbPlus } from "react-icons/tb";
import { z } from "zod";
import { useForm, zodResolver } from "@mantine/form";
import axiosConfig from "../configs/axios";
import { GET_PACKAGES_WITHOUT_FILTER, REGISTER, USERS } from "../utils/API_CONSTANT";
import { AxiosResponse } from "axios";
import { useQuery } from "react-query";
import { DataTable } from "mantine-datatable";
import { Pencil, Edit } from "tabler-icons-react";
import { showNotification } from "@mantine/notifications";
import { IconCheck } from "@tabler/icons";
import { User } from "../Types/types";
import { ConfirmModal } from "../components/ConfirmModal";
import { useLocation, useSearchParams } from "react-router-dom";
import { format } from "fecha";

type Props = {};

const schema = z.object({
  _id: z.string().optional(),
  firstname: z.string().min(2, "First name should have at least 2 letters"),
  lastname: z.string().min(2, "Last name should have at least 2 letters"),
  email: z.string().email("Invalid email"),
  password: z.string().optional(),
  role: z.enum(["Admin", "Vendor", "Customer", "Referrer"]),
  referred_by: z.string().optional(),
  referral_package: z.string().optional(),
  transaction_id: z.string().optional(),
  paymentScreenshotURL: z.string().optional(),
  referral_payment_status: z.enum(["Paid", "Unpaid"]).optional(),
});

const useStyles = createStyles((theme) => ({
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: theme.spacing.md,
  },
}));

type Product = z.infer<typeof schema>;

const fetchUsers = async ({ queryKey }: any) => {
  const [_, { search, page, limit, ...filters }] = queryKey;
  const params = new URLSearchParams(filters as any);
  const res: AxiosResponse = await axiosConfig.get(
    `${USERS}?search=${search}&page=${page}&limit=${limit}&${params}`
  );
  return res.data;
};

export function Users({}: Props) {
  const { classes } = useStyles();
  const theme = useMantineTheme();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  const user = JSON.parse(sessionStorage.getItem("user") || "{}");
  const [filters, setFilters] = useState({
    search: "",
    limit: 10,
    page: 1,
    email: "",
    role: searchParams.get("role") || "",
    referred_by: user.role !== "Admin" ? user.user_code : "",
    user_code: "",
    vendor: "",
  });
  const [packages, setPackages] = useState([]);
  const [filterUsers, setFilterUsers]: any = useState([]);
  const [isAddModalOpened, setIsAddModalOpened] = useState(false);
  const [openedDrawer, setOpenedDrawer] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [openedDelete, setOpenedDelete] = useState(false);
  const [deleteUser, setDeleteUser] = useState<User | null>(null);

  // Form for adding/updating users
  const form = useForm({
    validate: zodResolver(schema),
    initialValues: {
      _id: "",
      firstname: "",
      lastname: "",
      email: "",
      password: "",
      role: "" as "Admin" | "Vendor" | "Customer" | "Referrer",
      referred_by: "",
      referral_package: "",
      transaction_id: "",
      paymentScreenshotURL: "",
      referral_payment_status: "" as "Paid" | "Unpaid",
    },
  });

  // Filter form
  const filterFormInit = {
    email: "",
    role: "",
    user_code: "",
    referred_by: user.role !== "Admin" ? user.user_code : "",
    vendor: "",
  };
  const filterForm = useForm({ initialValues: filterFormInit });

  // Fetch users
  const { data: users, isLoading, refetch } = useQuery(
    ["users", filters],
    fetchUsers,
    { keepPreviousData: true }
  );

  useEffect(() => {
    if (!isLoading) {
      setFilterUsers(users?.data?.docs || []);
    }
  }, [isLoading, users]);

  // Fetch packages
  const fetchPackages = async () => {
    const res: AxiosResponse = await axiosConfig.get(GET_PACKAGES_WITHOUT_FILTER);
    const pkgs = res.data.map((x: any) => ({ value: x._id, label: x.title }));
    setPackages(pkgs);
  };
  useEffect(() => {
    fetchPackages();
  }, []);

  // Open modal for Add/Edit
  const handleOpenModal = (data: any = {}) => {
    setIsAddModalOpened(true);
    if (data._id) {
      form.setValues({
        ...data,
        password: "",
        referral_payment_status: data.referral_payment_status === true ? "Paid" : "Unpaid",
      });
    } else {
      form.reset();
    }
  };

  // Submit form
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const values = form.values;

    // Only clear referral info for Customers (non-admin)
    if (values.role === "Customer" && user.role !== "Admin") {
     
    }

    try {
      let res;
      let message = "";

      if (values._id) {
        res = await axiosConfig.put(`${USERS}/${values._id}`, values);
        message = "User Updated";
      } else {
        res = await axiosConfig.post(REGISTER, values);
        message = "User Added";
      }

      if (res.status === 200) {
        showNotification({ title: message, message: res.data.message, icon: <IconCheck />, color: "teal" });
        setIsAddModalOpened(false);
        form.reset();
        refetch();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  // Delete user
  const handleDelete = async (id: string) => {
    try {
      const res = await axiosConfig.delete(`${USERS}/${id}`);
      if (res.status === 200) {
        refetch();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Pagination
  const onPagination = async (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
    refetch();
  };

  // Search
  const onGlobalFilterChange = async (e: any) => {
    setFilters((prev) => ({ ...prev, search: e.target.value }));
    refetch();
  };

  // Filter form submit
  const handleFilterForm = async (e: FormEvent) => {
    e.preventDefault();
    setFilters((prev) => ({ ...prev, ...filterForm.values }));
    refetch();
    setOpenedDrawer(false);
  };

  return (
    <>
      {/* Header */}
      <div className={classes.header}>
        <Title>Users</Title>
        {user.role === "Admin" && <Button onClick={() => handleOpenModal()} leftIcon={<TbPlus />}>Add User</Button>}
      </div>

      {/* Search + Filter */}
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
        <TextInput icon={<Edit />} placeholder="Search" value={filters.search} onChange={onGlobalFilterChange} size="sm" />
        <Button leftIcon={<Edit />} size="sm" onClick={() => setOpenedDrawer(true)}>Filters</Button>
      </div>

      {/* Users DataTable */}
      <Box sx={{ height: "70vh" }}>
        <DataTable
          withBorder
          withColumnBorders
          striped
          highlightOnHover
          minHeight={150}
          page={users?.data?.page || 1}
          onPageChange={onPagination}
          totalRecords={users?.data?.totalDocs || 0}
          recordsPerPage={filters.limit}
          idAccessor="_id"
          fontSize="sm"
          records={users?.data?.docs || []}
          fetching={isLoading}
          columns={[
            {
              accessor: "index",
              title: "#",
              textAlignment: "right",
              width: 40,
              render: (record: User) => users?.data?.docs.indexOf(record) + 1,
            },
            { accessor: "name", render: ({ firstname, lastname }) => `${firstname} ${lastname}` },
            {
              accessor: "imageURL",
              title: "Profile Image",
              width: 100,
              render: ({ imageURL, paymentScreenshotURL, firstname, lastname }: any) => (
                <a href={imageURL || paymentScreenshotURL} target="_blank" rel="noopener noreferrer">
                  <Image src={imageURL || paymentScreenshotURL} width="100%" height={100} alt={`${firstname} ${lastname}`} withPlaceholder />
                </a>
              ),
            },
            { accessor: "email" },
            { accessor: "role" },
            { accessor: "createdAt", title: "Joined On", render: ({ createdAt }: any) => format(new Date(createdAt), "DD-MMM-YY") },
            { accessor: "packageName", render: ({ packageName }: User) => packageName?.length ? packageName[0].title : null },
            { accessor: "referred_by" },
            { accessor: "user_code" },
            { accessor: "commission" },
            { accessor: "transaction_id" },
            {
              accessor: "referral_payment_status",
              hidden: user.role !== "Admin",
              render: (record) => <span>{record.referral_payment_status || "Unpaid"}</span>,
            },
            {
              accessor: "action",
              hidden: user.role !== "Admin",
              render: (record) => (
                <Group spacing={4} noWrap>
                  <ActionIcon color="blue" onClick={() => handleOpenModal(record)}>
                    <Edit size={18} />
                  </ActionIcon>
                </Group>
              ),
            },
          ]}
        />
      </Box>

      {/* Add/Edit User Modal */}
      <Modal opened={isAddModalOpened} onClose={() => { setIsAddModalOpened(false); form.reset(); }} title={form.values._id ? "Update User" : "Add User"} size="lg">
        <form onSubmit={handleSubmit}>
          <SimpleGrid cols={2}>
            <TextInput label="First Name" required {...form.getInputProps("firstname")} />
            <TextInput label="Last Name" required {...form.getInputProps("lastname")} />
          </SimpleGrid>

          <SimpleGrid cols={2} mt="xs">
            <TextInput label="Email" required {...form.getInputProps("email")} disabled={!!form.values._id && form.values.role === "Admin"} />
            {!form.values._id && <TextInput label="Password" type="password" required {...form.getInputProps("password")} />}
          </SimpleGrid>

          <Select label="User Role" mt="xs" data={[
            { value: "Vendor", label: "Vendor" },
            { value: "Customer", label: "Customer" },
            { value: "Referrer", label: "Referrer" },
            { value: "Admin", label: "Admin" },
          ]} placeholder="User Role" {...form.getInputProps("role")} required />

          {/* Referral fields for Admin or Referrer */}
          {(user.role === "Admin" || form.values.role === "Referrer") && (
            <>
              <Select label="Package" mt="xs" data={packages} clearable {...form.getInputProps("referral_package")} />
              <TextInput label="Referred by" placeholder="Referred by" {...form.getInputProps("referred_by")} disabled={user.role !== "Admin"} />
              <TextInput label="Transaction ID" {...form.getInputProps("transaction_id")} />
              <TextInput label="Payment Screenshot URL" {...form.getInputProps("paymentScreenshotURL")} />
              <Select label="Referral Payment Status" mt="xs" clearable data={[
                { value: "Paid", label: "Paid" },
                { value: "Unpaid", label: "Unpaid" },
              ]} {...form.getInputProps("referral_payment_status")} />
            </>
          )}

          <Button type="submit" fullWidth mt="sm" loading={submitting}>Submit</Button>
        </form>
      </Modal>

      {/* Filter Drawer */}
      <Drawer opened={openedDrawer} onClose={() => setOpenedDrawer(false)} title="Filter" padding="xl" overlayBlur={3} position="right" size="md">
        <form onSubmit={handleFilterForm}>
          <TextInput label="Email" {...filterForm.getInputProps("email")} />
          <TextInput label="User Code" {...filterForm.getInputProps("user_code")} />
          {user.role === "Admin" && <TextInput label="Referred by" {...filterForm.getInputProps("referred_by")} />}
          <Select label="Role" mt="xs" data={[
            { value: "Vendor", label: "Vendor" },
            { value: "Customer", label: "Customer" },
            { value: "Referrer", label: "Referrer" },
            { value: "Admin", label: "Admin" },
          ]} clearable {...filterForm.getInputProps("role")} />
          <Group mt="md">
            <Button type="button" onClick={() => { filterForm.reset(); setFilters({ ...filters, ...filterFormInit }); refetch(); setOpenedDrawer(false); }}>Reset</Button>
            <Button type="submit">Filter</Button>
          </Group>
        </form>
      </Drawer>

      {/* Confirm Delete Modal */}
      <ConfirmModal
        opened={openedDelete}
        _id={deleteUser?._id}
        apiPoint={USERS}
        refetch={refetch}
        title={`Are you sure you want to delete ${deleteUser?.firstname} ${deleteUser?.lastname}?`}
        onClose={() => { setOpenedDelete(false); setDeleteUser(null); }}
      />
    </>
  );
}
