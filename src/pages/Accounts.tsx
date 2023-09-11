import {
  ActionIcon,
  Avatar,
  Box,
  Button,
  createStyles,
  Drawer,
  Group,
  Image,
  Input,
  Modal,
  NumberInput,
  Select,
  Text,
  TextInput,
  Title,
  useMantineTheme,
} from "@mantine/core";
import { useForm, zodResolver } from "@mantine/form";
import { showNotification } from "@mantine/notifications";
import { IconCheck } from "@tabler/icons";
import { AxiosResponse } from "axios";
import { DataTable } from "mantine-datatable";
import { FormEvent, forwardRef, useState } from "react";
import { TbPlus } from "react-icons/tb";
import { useQuery } from "react-query";
import { Edit, Filter, Search, Trash } from "tabler-icons-react";
import { z } from "zod";
import { ConfirmModal } from "../components/ConfirmModal";
import axiosConfig from "../configs/axios";
import { ACCOUNTS, CATEGORIES } from "../utils/API_CONSTANT";
import { banks } from "../banks";
type Props = {};

interface ItemProps extends React.ComponentPropsWithoutRef<"div"> {
  image: string;
  label: string;
}

const SelectItem = forwardRef<HTMLDivElement, ItemProps>(
  ({ image, label, ...others }: ItemProps, ref) => (
    <div ref={ref} {...others}>
      <Group noWrap>
        <Image src={image} width={80} height={80} fit="contain" />
        {/* just checking */}

        <div>
          <Text size="sm">{label}</Text>
        </div>
      </Group>
    </div>
  )
);

const schema = z
  .object({
    _id: z.string(),
    title: z
      .string()
      .trim()
      .min(2, { message: "User account should have at least 2 letters" }),
    type: z.string(),
    bankName: z.string(),
    account_number: z.string(),
    iban: z.string().optional(),
    user: z.string(),
    limitACN: z.number(),
    minLimitACN: z.number(),
    maxLimitACN: z.number(),
  })
  .superRefine((val, ctx) => {
    if (val.type === "Bank") {
      if (val.bankName === undefined || val.bankName.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["bankName"],
          message: "Please select a bank",
        });
      }

      if (val.limitACN > 0) {
        if (val.account_number.length !== val.limitACN) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["account_number"],
            message: "account number should be equal to " + val.limitACN,
          });
        }
      }
      if (val.minLimitACN > 0 && val.maxLimitACN > 0) {
        if (
          val.account_number.length < val.minLimitACN ||
          val.account_number.length > val.maxLimitACN
        ) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["account_number"],
            message:
              "account number should be min " +
              val.minLimitACN +
              " and max " +
              val.maxLimitACN,
          });
        }
      }
      if (
        val.iban === undefined ||
        val.iban.length < 15 ||
        val.iban.length > 25
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["iban"],
          message:
            "IBAN number should be minimum to 16 characters and maximum 24 characters",
        });
      }
    } else {
      if (val.account_number === undefined || val.account_number === "") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["account_number"],
          message: "Please enter acount number",
        });
      }
    }
  });

const useStyles = createStyles((theme) => ({
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
  },
}));

type UserAccount = z.infer<typeof schema>;

const fetchTableData = async ({ queryKey }: any) => {
  const [_, { search, page, limit, user, ...filters }] = queryKey;
  const params = new URLSearchParams(filters);
  const userstore = JSON.parse(sessionStorage.getItem("user") || "{}");

  const url =
    userstore.role !== "Admin"
      ? `${ACCOUNTS}/user/${user}?search=${search}&page=${page}&limit=${limit}&${params}`
      : `${ACCOUNTS}/?search=${search}&page=${page}&limit=${limit}&${params}`;

  const res: AxiosResponse = await axiosConfig.get(url);
  const data = res.data;
  return data;
};

const fetchUserAccounts = async () => {
  const res = await axiosConfig.get(`${CATEGORIES}/without_filter`);
  const data = res.data;
  return data;
};
export function Accounts({}: Props) {
  const user = JSON.parse(sessionStorage.getItem("user") || "{}");

  const [opened, setOpened] = useState(false);
  const [deleteUserAccount, setDeleteUserAccount] =
    useState<UserAccount | null>(null);
  const [openedDrawer, setOpenedDrawer] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [filters, setfilters] = useState({
    search: "",
    limit: 10,
    page: 1,
    user: user.role === "Vendor" || "Referrer" ? user._id : "",
    type: "",
    bankName: "",
    account_number: "",
    iban: "",
  });
  // function createUserAccounts(userAccounts: any, parentId = null): any {
  //   const userAccountList = [];
  //   let userAccount;
  //   if (parentId == null) {
  //     userAccount = userAccounts.filter((cat: any) => cat.parentId == undefined);
  //   } else {
  //     userAccount = userAccounts.filter((cat: any) => cat.parentId == parentId);
  //   }

  //   for (let cate of userAccount) {
  //     userAccountList.push({
  //       _id: cate._id,
  //       title: cate.title,
  //       slug: cate.slug,
  //       parentId: cate.parentId,
  //       isActive: cate.isActive,
  //       isFeatured: cate.isFeatured,
  //       // type: cate.type,
  //       children: createUserAccounts(userAccounts, cate._id),
  //     });
  //   }

  //   return userAccountList;
  // }

  const {
    isLoading,
    error,
    data: userAccounts,
    refetch,
  } = useQuery(["userAccounts", filters], fetchTableData, {
    enabled: true,
    refetchOnWindowFocus: false,
  });
  // const [userAccountsDropdown, setUserAccountsDropdown] = useState([]);
  // const {
  //   data: userAccountsWithOutFilter,
  //   isLoading: isLoadinguserAccountsWithOutFilter,
  // } = useQuery(["userAccountsWithOutFilter"], fetchUserAccounts);
  // useEffect(() => {
  //   if (!isLoadinguserAccountsWithOutFilter) {
  //     const cats = userAccountsWithOutFilter.map((userAccount: any) => ({
  //       ...userAccount,
  //       value: userAccount._id,
  //       label: userAccount.title,
  //     }));
  //     setUserAccountsDropdown(cats);
  //   }
  // }, [userAccountsWithOutFilter]);

  const { classes } = useStyles();
  const [isAddModalOpened, setIsAddModalOpened] = useState(false);
  const [image, setImage]: any = useState("");

  const theme = useMantineTheme();

  const form = useForm({
    validate: zodResolver(schema),
    initialValues: {
      _id: "",
      user: user.role === "Vendor" || "Referrer" ? user._id : "",
      title: "",
      type: "",
      bankName: "",
      account_number: "",
      iban: "",
      limitACN: 0,
      minLimitACN: 0,
      maxLimitACN: 0,
    },
  });

  const filterFormInit = {
    isFeatured: "",
    isActive: "",
  };
  const filterForm = useForm({
    initialValues: filterFormInit,
  });
  async function handleSubmit(values: typeof form.values) {
    // e.preventDefault();
    // const values = form.values;
    // setSubmitting(true);
    const options = {
      headers: {
        "Content-Type": "application/json",
      },
    };
    let res;
    let userAccountAddOrUpdateTitle = "";

    if (values._id) {
      res = await axiosConfig.put(ACCOUNTS + "/" + values._id, values, options);
      userAccountAddOrUpdateTitle = "User Account updated";
    } else {
      res = await axiosConfig.post(ACCOUNTS, values, options);
      userAccountAddOrUpdateTitle = "User Account Added";
    }

    if (res?.status === 200) {
      setSubmitting(false);
      setIsAddModalOpened(false);
      form.reset();
      refetch();
      showNotification({
        title: userAccountAddOrUpdateTitle,
        message: res.data.message,
        icon: <IconCheck />,
        color: "teal",
      });
    }
  }
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
  const handleOpenModal = (data: any = {}) => {
    setIsAddModalOpened(true);
    if (data._id) {
      form.setValues(data);
    }
  };
  const handleDelete = async (id: string) => {
    const options = {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    };
    const res = await axiosConfig.delete(ACCOUNTS + "/" + id, options);
    const data = res.data;
    if (res.status === 200) {
      setSubmitting(false);
      setIsAddModalOpened(false);
      refetch();
      // form.reset();
    }
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
          <Input
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

  return (
    <>
      <div className={classes.header}>
        <Title>Accounts</Title>
        {user.role !== "Admin" && (
          <Button
            onClick={() => handleOpenModal()}
            leftIcon={<TbPlus size={18} />}
          >
            Add Account
          </Button>
        )}
      </div>
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
            Filters
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
          page={userAccounts?.data?.page}
          onPageChange={onPagination}
          totalRecords={userAccounts?.data?.totalDocs}
          recordsPerPage={filters.limit}
          idAccessor="_id"
          fontSize="sm"
          records={userAccounts?.data.docs}
          fetching={isLoading}
          columns={[
            {
              accessor: "_id",
              title: "#",
              textAlignment: "right",
              width: 40,
              render: (record: UserAccount) =>
                userAccounts?.data?.docs.indexOf(record) + 1,
            },
            {
              accessor: "title",
            },
            {
              accessor: "type",
            },
            {
              accessor: "bankName",
            },

            {
              accessor: "account_number",
            },
            {
              accessor: "iban",
            },
            {
              accessor: "actions",
              hidden: user.role === "Admin",
              render: (record: UserAccount) => (
                <>
                  <Group spacing={4} noWrap>
                    <ActionIcon
                      color="blue"
                      component="button"
                      variant="light"
                      onClick={(e) => {
                        //  e.stopPropagation();
                        handleOpenModal(record);
                      }}
                    >
                      <Edit size={18} />
                    </ActionIcon>
                    <ActionIcon
                      color="red"
                      variant="light"
                      component="button"
                      disabled={record._id === "635d7aa623840ef068eb748f"}
                      onClick={(e) => {
                        // e.stopPropagation();
                        setOpened(true), setDeleteUserAccount(record);
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
          form.values._id
            ? "Update UserAccount Details"
            : "Add UserAccount Details"
        }
        size="lg"
      >
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <TextInput
            label="Account Title"
            placeholder="Enter your account name"
            withAsterisk
            {...form.getInputProps("title")}
          />
          <Select
            data={["Easy Paisa", "Jazz Cash", "Bank"]}
            placeholder="Type"
            label="Select Type"
            my={"xs"}
            {...form.getInputProps("type")}
          />
          {form.values.type == "Bank" && (
            <Select
              label="Bank Name"
              data={banks}
              placeholder="Enter your bank name"
              withAsterisk
              searchable
              maxDropdownHeight={400}
              nothingFound="Nobody here"
              itemComponent={SelectItem}
              filter={(value, item) =>
                item.label!.toLowerCase().includes(value.toLowerCase().trim())
              }
              // {...form.getInputProps("bankName")}
              onChange={(e) => {
                form.setFieldValue("bankName", e ?? "");
                banks.forEach((bank) => {
                  if (bank.value === e) {
                    if (bank.minLimitACN && bank.maxLimitACN) {
                      form.setFieldValue("minLimitACN", bank.minLimitACN!);
                      form.setFieldValue("maxLimitACN", bank.maxLimitACN!);
                      return;
                    }
                    form.setFieldValue("limitACN", bank.limitACN!);
                  }
                });
              }}
            />
          )}

          <TextInput
            type="number"
            label="Account Number"
            placeholder="Enter your account name"
            withAsterisk={form.values.type !== "Bank"}
            {...form.getInputProps("account_number")}
          />
          {form.values.type == "Bank" && (
            <TextInput
              label="IBAN"
              placeholder="Enter IBAN"
              withAsterisk
              {...form.getInputProps("iban")}
            />
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
          {/* <Select
            label="Is Featured"
            mt={"xs"}
            data={[
              { label: "All", value: "" },
              { label: "Yes", value: true },
              { label: "No", value: false },
            ]}
            placeholder="Is Featured"
            {...filterForm.getInputProps("isFeatured")}
            clearable
          />
          <Select
            label="Is Active"
            mt={"xs"}
            data={[
              { label: "All", value: "" },
              { label: "Yes", value: true },
              { label: "No", value: false },
            ]}
            placeholder="Is Active"
            {...filterForm.getInputProps("isActive")}
            clearable
          /> */}
          <br />
          <Button
            type="button"
            style={{ marginRight: 10 }}
            onClick={() => {
              filterForm.reset();
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
        _id={deleteUserAccount?._id}
        apiPoint={ACCOUNTS}
        refetch={refetch}
        title={`Are you sure you want to delete ${deleteUserAccount?.title} userAccount?`}
        onClose={() => {
          setOpened(false), setDeleteUserAccount(null);
        }}
      />
    </>
  );
}
