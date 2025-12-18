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
import { set, z } from "zod";
import { useForm, zodResolver } from "@mantine/form";
import axiosConfig from "../configs/axios";
import {
  GET_PACKAGES_WITHOUT_FILTER,
  REGISTER,
  USERS,
} from "../utils/API_CONSTANT";
import { Axios, AxiosResponse } from "axios";
import { useQuery } from "react-query";
// import { DataTable } from "primereact/datatable";
import { DataTable } from "mantine-datatable";
import { Column } from "primereact/column";
import {
  Pencil,
  Trash,
  Settings,
  Search,
  Filter,
  Edit,
  Anchor,
} from "tabler-icons-react";
import { showNotification } from "@mantine/notifications";
import { IconCheck } from "@tabler/icons";
import { User } from "../Types/types";
import { ConfirmModal } from "../components/ConfirmModal";
import { useLocation, useSearchParams } from "react-router-dom";
import { format } from "fecha";

type Props = {};

const schema = z.object({
  _id: z.string(),
  username: z
    .string()
    .min(6, { message: "Name should have at least 2 letters" })
    .trim(),
  email: z.string(),
  firstname: z.number(),
  lastname: z.number(),
  // password: z.boolean(),
  role: z.boolean(),
  referred_by: z.number(),
  referral_package: z.string(),
});

const useStyles = createStyles((theme) => ({
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
  },
}));

type Product = z.infer<typeof schema>;

const fetchUsers = async ({ queryKey }: any) => {
  const [_, { search, page, limit, ...filters }] = queryKey;
  const params = new URLSearchParams(filters);
  const res: AxiosResponse = await axiosConfig.get(
    `${USERS}?search=${search}&page=${page}&limit=${limit}&${params}`
  );
  const data = res.data;
  return data;
};

export function Users({}: Props) {
  const [opened, setOpened] = useState(false);
  const [deleteUser, setDeleteUser] = useState<User | null>(null);
  const user = JSON.parse(sessionStorage.getItem("user") || "{}");
  const [data, setData]: any = useState({});
  const [openedDrawer, setOpenedDrawer] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const location = useLocation();
  let [searchParams, setSearchParams] = useSearchParams();
  let params: Record<string, string | null> = {};

  for (let [key, value] of searchParams.entries()) {
    params[key] = value;
  }
  const [filterUsers, setFilterUsers]: any = useState([]);
  const [packages, setPackages] = useState([]);
  const [filters, setfilters] = useState({
    search: "",
    limit: 10,
    page: 1,
    email: "",
    role: params?.role ?? "",
    referred_by: user.role !== "Admin" ? user.user_code : "",
    user_code: "",
    vendor: "",
  });

  const {
    isLoading,
    error,
    data: users,
    refetch,
  } = useQuery(["users", filters], fetchUsers, {
    enabled: true,
    // refetchOnWindowFocus: false,
  });
  useEffect(() => {
    if (!isLoading) {
      let _u = users?.data.docs || [];
      // if (user.role !== "Admin") {
      //   _u = _u.filter((x: any) => x.referred_by === user.user_code);
      // }
      setFilterUsers(_u);
    }
  }, [isLoading, users]);
  const { classes } = useStyles();
  const [isAddModalOpened, setIsAddModalOpened] = useState(false);

  const theme = useMantineTheme();
  const fetchPackages = async () => {
    const res: AxiosResponse = await axiosConfig.get(
      GET_PACKAGES_WITHOUT_FILTER
    );
    const data = res.data;
    const packages = data.map((x: any) => ({
      value: x._id,
      label: x.title,
    }));
    setPackages(packages);
  };
  useEffect(() => {
    fetchPackages();
  }, []);
  const form = useForm({
    validate: zodResolver(schema),
    initialValues: {
      _id: "",
      email: "",
      firstname: "",
      lastname: "",
      // password: "",
      role: "",
      referred_by: "",
      referral_package: "",
    },
  });

  const filterFormInit = {
    email: "",
    role: "",
    user_code: "",
    referred_by: user.role !== "Admin" ? user.user_code : "",
    vendor: "",
  };
  const filterForm = useForm({
    initialValues: filterFormInit,
  });
  async function handleSubmit(e: FormEvent) {
   
    e.preventDefault();
    const values = form.values;


    if (values.role === "Customer") {
  values.referral_package = undefined as any;
}


    



    setSubmitting(true);
    let res;
    let userAddOrUpdateTitle = "";

    if (values._id) {
      res = await axiosConfig.put(USERS + "/" + values._id, values);
      userAddOrUpdateTitle = "User Updated";
    } else {
      res = await axiosConfig.post(REGISTER, values);
      userAddOrUpdateTitle = "User Added";
    }
    if (res?.status === 200) {
      setSubmitting(false);
      setIsAddModalOpened(false);
      form.reset();
      refetch();
      showNotification({
        title: userAddOrUpdateTitle,
        message: res.data.message,
        icon: <IconCheck />,
        color: "teal",
      });
    }
  }
  const handleOpenModal = (data: any = {}) => {
    setIsAddModalOpened(true);
    if (data._id) {
      delete data.password;
      form.setValues(data);
    }
  };
  const handleDelete = async (id: string) => {
    const res = await axiosConfig.delete(USERS + "/" + id);
    if (res.status === 200) {
      setSubmitting(false);
      setIsAddModalOpened(false);
      refetch();
      form.reset();
    }
  };
  const actionBodyTemplate = (rowData: any) => {
    return (
      <>
        <Button
          ml={"xs"}
          size="xs"
          type="button"
          onClick={() => handleOpenModal(rowData)}
        >
          <Pencil size={16} />
        </Button>
        <Button size="xs" ml={"xs"} type="button">
          <Trash size={16} onClick={() => handleDelete(rowData._id)} />
        </Button>
      </>
    );
  };
  const onGlobalFilterChange = async (e: any) => {
    const value = e.target.value;
    setfilters((prev: any) => ({ ...prev, search: value }));
    await refetch();
  };
  const renderHeader = () => {
    return (
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <div>
          <TextInput
            icon={<Search />}
            placeholder="Search"
            value={filters.search}
            onChange={onGlobalFilterChange}
            style={{ width: "fit-content" }}
          />
        </div>
        <div>
          <Button
            onClick={() => setOpenedDrawer(true)}
            leftIcon={<Filter size={18} />}
          >
            Filters
          </Button>
        </div>
      </div>
    );
  };
  const onPagination = async (event: any) => {
    await setfilters((prev: any) => ({
      ...prev,
      // limit: event.rows,
      page: event,
    }));
    await refetch();
  };

  const handleFilterForm = async (e: FormEvent) => {
    e.preventDefault();
    const values = filterForm.values;
    setfilters((prev) => ({
      ...prev,
      ...values,
    }));
    refetch();
    setOpenedDrawer(false);
  };
  return (
    <>
      <div className={classes.header}>
        <Title>Users</Title>
        {user.role === "Admin" && (
          <Button
            onClick={() => handleOpenModal()}
            leftIcon={<TbPlus size={18} />}
          >
            Add User
          </Button>
        )}
      </div>
      {/* <DataTable
        value={filterUsers}
        dataKey="id"
        onPage={onPagination}
        totalRecords={users?.data?.totalDocs}
        loading={isLoading}
        lazy
        header={renderHeader}
        responsiveLayout="scroll"
        paginator
        size="small"
        paginatorTemplate="CurrentPageReport FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown"
        currentPageReportTemplate="Showing {first} to {last} of {totalRecords}"
        rows={filters.limit}
        rowsPerPageOptions={[10, 20, 50]}
        emptyMessage="No Users found."
      >
        <Column
          field="name"
          header="Name"
          body={({ firstname, lastname }) => (
            <span>
              {firstname} {lastname}
            </span>
          )}
        ></Column>
        <Column field="email" header="Email"></Column>
        <Column field="role" header="Role"></Column>
        <Column field="referred_by" header="Referred by"></Column>
        <Column field="user_code" header="User code"></Column>
        <Column field="user_code" header="Commission"></Column>
        {user.role === "Admin" && (
          <Column
            headerStyle={{ width: "4rem", textAlign: "center" }}
            bodyStyle={{
              textAlign: "center",
              overflow: "visible",
              display: "flex",
              justifyContent: "space-between",
              height: "100%",
            }}
            header="Action"
            // style={{ height: "100%" }}
            body={actionBodyTemplate}
          />
        )}
      </DataTable> */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: "16px",
        }}
      >
        <div>
          <TextInput
            icon={<Search size={16} />}
            placeholder="Search"
            value={filters.search}
            onChange={onGlobalFilterChange}
            style={{ width: "fit-content" }}
            size={"sm"}
          />
        </div>
        <div>
          <Button
            onClick={() => setOpenedDrawer(true)}
            leftIcon={<Filter size={16} />}
            size={"sm"}
          >
            Filterss
          </Button>
        </div>
      </div>
      <Box sx={{ height: "70vh" }}>
        <DataTable
          withBorder
          withColumnBorders
          striped
          highlightOnHover
          minHeight={"150px"}
          page={users?.data?.page}
          onPageChange={onPagination}
          totalRecords={users?.data?.totalDocs}
          recordsPerPage={filters.limit}
          idAccessor="_id"
          fontSize="sm"
          records={users?.data?.docs}
          fetching={isLoading}
          columns={[
            {
              accessor: "index",
              title: "#",
              textAlignment: "right",
              width: 40,
              render: (record: User) => users?.data?.docs.indexOf(record) + 1,
            },
            {
              accessor: "name",
              render: ({ firstname, lastname }) => (
                <>
                  {firstname} {lastname}
                </>
              ),
            },



              
//   {
//   accessor: "imageURL",
//   title: "Profile Image",
//   width: 100,
//   cellsStyle: {
//     height: 100,
//     margin: "auto 0",
//   },
//   render: ({paymentScreenshotId,paymentScreenshotURL}: User) => (
//     <Image
//       width="100%"
//       height={100}
//       src={paymentScreenshotURL ? paymentScreenshotURL : paymentScreenshotId}
      
//       withPlaceholder
//     />
//   ),
// },

    
{
  accessor: "imageURL",
  title: "Profile Image",
  width: 100,
  cellsStyle: {
    height: 100,
    margin: "auto 0",
  },
  render: ({ imageURL, paymentScreenshotURL, firstname, lastname }: any) => (
    <a 
      href={imageURL || paymentScreenshotURL} 
      target="_blank" 
      rel="noopener noreferrer"
    >
      <Image
        width="100%"
        height={100}
        src={imageURL || paymentScreenshotURL} // agar profile image nahi hai to payment screenshot show
        alt={`${firstname} ${lastname}`}
        withPlaceholder
      />
    </a>
  ),
},

  
           





            {
              accessor: "email",
            },
            {
              accessor: "role",
            },
            {
              accessor: "createdAt",
              title: "Joined On",
              render: ({ createdAt }: any) => (
                <>{format(new Date(createdAt), "DD-MMM-YY")}</>
              ),
            },
            {
              accessor: "packageName",
              render: ({ packageName }: User) =>
                packageName.length ? packageName[0]?.title : null,
            },
            {
              accessor: "referred_by",
            },
            {
              accessor: "user_code",
            },
            {
              accessor: "commission",
            },
            {
              accessor: "transaction_id",
            },
            {
              accessor: "referral_payment_status",
              hidden: user.role !== "Admin",
              render: (record, index) => (
                <span>
                  {record.referral_payment_status ? "Paid" : "Unpaid"}
                </span>
              ),
            },
            {
              accessor: "action",
              hidden: user.role !== "Admin",
              render: (record) => (
                <>
                  {user.role === "Admin" && (
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
                        onClick={(e) => {
                          // e.stopPropagation();
                          setOpened(true), setDeleteUser(record);
                        }}
                      >
                        <Trash size={18} />
                      </ActionIcon>
                    </Group>
                  )}
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
        title={form.values._id ? "Update User Details" : "Add User Details"}
        size="lg"
      >
        <form onSubmit={handleSubmit}>
          <SimpleGrid mt={"xs"} cols={2}>
            <TextInput
              label="First Name"
              placeholder="First Name"
              required
              {...form.getInputProps("firstname")}
            />
            <TextInput
              label="Last Name"
              placeholder="Last Name"
              required
              {...form.getInputProps("lastname")}
            />
          </SimpleGrid>
          <SimpleGrid mt={"xs"} cols={2}>
            <TextInput
              label="Email"
              placeholder="Email"
              type="email"
              required
              {...form.getInputProps("email")}
            />

            
     {!form.values._id && (
  <TextInput
    label="Password"
    placeholder="Password"
    type="password"
    required
    {...form.getInputProps("password")}
  />
)}

          </SimpleGrid>
          <Select
            label="User Role"
            mt={"xs"}
            clearable
            data={[
              { value: "Vendor", label: "Vendor" },
              { value: "Customer", label: "Customer" },
              { value: "Referrer", label: "Referrer" },
              { value: "Admin", label: "Admin" },
            ]}
            placeholder="User Role"
            {...form.getInputProps("role")}
            required
          />
          {form.values.role === "Referrer" && (
            <>
              <Select
                label="Packages"
                mt={"xs"}
                data={packages}
                clearable
                placeholder="Packages"
                {...form.getInputProps("referral_package")}
              />
              <TextInput
                label="Referred by"
                placeholder="Referred by"
                {...form.getInputProps("referred_by")}
              />




              
              <Select
                  label="Referral Payment Status"
                  mt={"xs"}
                  clearable
                  data={[
                    // { label: "Paid" },
                    // { label: "Unpaid" },
                    "Paid",
                    "unpaid"
                  ]}
                  placeholder="Referral Payment Status"
                  {...form.getInputProps("referral_payment_status")}
              />

            </>
            
          )}

          <Button loading={submitting} type="submit" fullWidth my={"sm"}>
            Submit
          </Button>
        </form>
      </Modal>
      <Drawer
        opened={openedDrawer}
        onClose={() => setOpenedDrawer(false)}
        padding="xl"
        title="Filter"
        overlayColor={
          theme.colorScheme === "dark"
            ? theme.colors.dark[9]
            : theme.colors.gray[2]
        }
        position="right"
        size="md"
        overlayOpacity={0.55}
        overlayBlur={3}
      >
        {/* Drawer content */}
        <form onSubmit={handleFilterForm}>
          <TextInput
            label="Email"
            placeholder="Email"
            {...filterForm.getInputProps("email")}
          />
          <TextInput
            label="User Code"
            placeholder="User Code"
            {...filterForm.getInputProps("user_code")}
          />
          {user.role === "Admin" && (
            <TextInput
              label="Referred by"
              placeholder="Referred by"
              {...filterForm.getInputProps("referred_by")}
            />
          )}
          <Select
            label="Role"
            mt={"xs"}
            data={[
              { value: "Vendor", label: "Vendor" },
              { value: "Customer", label: "Customer" },
              { value: "Referrer", label: "Referrer" },
              { value: "Admin", label: "Admin" },
            ]}
            placeholder="Role"
            {...filterForm.getInputProps("role")}
            clearable
          />
          <br />
          <Button
            type="button"
            style={{ marginRight: 10 }}
            onClick={() => {
              filterForm.reset();
              setSearchParams({});
              params = {};
              setfilters((prev) => ({
                ...prev,
                ...filterFormInit,
              }));
              refetch();
              setOpenedDrawer(false);
            }}
          >
            Reset
          </Button>
          <Button type="submit">Filter</Button>
        </form>
      </Drawer>
      <ConfirmModal
        opened={opened}
        _id={deleteUser?._id}
        apiPoint={USERS}
        refetch={refetch}
        title={`Are you sure you want to delete ${deleteUser?.firstname} ${deleteUser?.lastname} User?`}
        onClose={() => {
          setOpened(false), setDeleteUser(null);
        }}
      />
    </>
  );
}
