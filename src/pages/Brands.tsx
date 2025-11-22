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
} from "@mantine/core";
import { FormEvent, useState } from "react";
import { TbPlus } from "react-icons/tb";
import { z } from "zod";
import { useForm, zodResolver } from "@mantine/form";
import axiosConfig from "../configs/axios";
import { BRANDS } from "../utils/API_CONSTANT";
import { AxiosResponse } from "axios";
import { getFormData } from "../utils/getFormData";
import { useQuery } from "react-query";
// import { DataTable } from "primereact/datatable";
import { DataTable } from "mantine-datatable";
import { Column } from "primereact/column";
import { Pencil, Trash, Search, Filter, Edit } from "tabler-icons-react";
import placeholder from "../assets/placeholder.png";
import { showNotification } from "@mantine/notifications";
import { IconCheck } from "@tabler/icons";
import { ConfirmModal } from "../components/ConfirmModal";

type Props = {};

const schema = z.object({
  _id: z.string(),
  imageURL: z.string(),
  imageId: z.string(),
  title: z
    .string()
    .min(2, { message: "Name should have at least 2 letters" })
    .trim(),
  file: z.instanceof(File),
  isFeatured: z.boolean(),
  isActive: z.boolean(),
  userId: z.string(),
});

const useStyles = createStyles((theme) => ({
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
  },
}));

type Brand = z.infer<typeof schema>;

const fetchTableData = async ({ queryKey }: any) => {
  const [_, { search, page, limit, ...filters }] = queryKey;
  const params = new URLSearchParams(filters);
  const res: AxiosResponse = await axiosConfig.get(
    `${BRANDS}?search=${search}&page=${page}&limit=${limit}&${params}`
  );
  const data = res.data;
  return data;
};

export function Brands({}: Props) {
  const user = JSON.parse(sessionStorage.getItem("user") || "{}");

  const [opened, setOpened] = useState(false);
  const [deleteBrand, setDeleteBrand] = useState<Brand | null>(null);
  const [openedDrawer, setOpenedDrawer] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [filters, setfilters] = useState({
    search: "",
    limit: 10,
    page: 1,
    productCode: "",
    brand: "",
    isFeatured: "",
    isActive: "",
    userId: user.role === "Vendor" ? user._id : "",
  });

  const {
    isLoading,
    error,
    data: brands,
    refetch,
  } = useQuery(["brands", filters], fetchTableData, {
    enabled: true,
    refetchOnWindowFocus: false,
  });

  const { classes } = useStyles();
  const [isAddModalOpened, setIsAddModalOpened] = useState(false);
  const [image, setImage]: any = useState("");
  // NEW: applyToProducts state (default true so admin can uncheck if not desired)
  const [applyToProducts, setApplyToProducts] = useState<boolean>(true);

  const theme = useMantineTheme();

  const form = useForm({
    validate: zodResolver(schema),
    initialValues: {
      _id: "",
      title: "",
      file: null,
      imageURL: "",
      imageId: "",
      isFeatured: false,
      isActive: false,
      userId: user._id,
    },
  });

  const filterFormInit = {
    isFeatured: "",
    isActive: "",
  };
  const filterForm = useForm({
    initialValues: filterFormInit,
  });

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const values = form.values;

    // Ensure applyToProducts is included in the values so getFormData will add it to FormData
    // Backend expects "true"/"false" when multipart/form-data is used
    // store as string because FormData serializes primitives
    (values as any).applyToProducts = applyToProducts ? "true" : "false";

    setSubmitting(true);

    // create FormData from values (getFormData should handle nested values appropriately)
    const formData = getFormData(values);

    const options = {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    };
    let res;
    let brandAddOrUpdateTitle = "";

    try {
      if (values._id) {
        res = await axiosConfig.put(BRANDS + "/" + values._id, formData, options);
        brandAddOrUpdateTitle = "Brand updated";
      } else {
        res = await axiosConfig.post(BRANDS, formData, options);
        brandAddOrUpdateTitle = "Brand Added";
      }

      if (res?.status === 200) {
        setIsAddModalOpened(false);
        form.reset();
        refetch();
        setImage("");
        // reset applyToProducts to default true after submit
        setApplyToProducts(true);
        showNotification({
          title: brandAddOrUpdateTitle,
          message: res.data.message,
          icon: <IconCheck />,
          color: "teal",
        });
      }
    } catch (err) {
      // optionally show notification for error
      showNotification({
        title: "Request failed",
        message: "Unable to save brand — check console/network for details.",
        color: "red",
      });
      console.error("Brand save error:", err);
    } finally {
      setSubmitting(false);
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
      // keep applyToProducts default true when editing; admin can choose before submit
      setApplyToProducts(true);
    } else {
      form.reset();
      setApplyToProducts(true);
    }
  };
  const handleDelete = async (id: string) => {
    const options = {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    };
    const res = await axiosConfig.delete(BRANDS + "/" + id, options);
    const data = res.data;
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
        <Button size="xs" type="button">
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
        <Title>Brands</Title>
        <Button
          onClick={() => handleOpenModal()}
          leftIcon={<TbPlus size={18} />}
        >
          Add Brand
        </Button>
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
          page={brands?.data?.page}
          onPageChange={onPagination}
          totalRecords={brands?.data?.totalDocs}
          recordsPerPage={filters.limit}
          idAccessor="_id"
          fontSize="sm"
          records={brands?.data?.docs}
          fetching={isLoading}
          columns={[
            {
              accessor: "index",
              title: "#",
              textAlignment: "right",
              width: 40,
              render: (record) => brands?.data?.docs.indexOf(record) + 1,
            },
            {
              accessor: "title",
            },
            {
              accessor: "imageURL",
              render: (record: Brand) => (
                <Image
                  width={100}
                  height={100}
                  src={record.imageURL}
                  alt={record.title}
                  withPlaceholder
                />
              ),
            },
            {
              accessor: "isActive",
              render: ({ isActive }: Brand) => (
                <span>{isActive ? "Yes" : "No"}</span>
              ),
            },
            {
              accessor: "isFeatured",
              render: ({ isFeatured }: Brand) => (
                <span>{isFeatured ? "Yes" : "No"}</span>
              ),
            },
            {
              accessor: "actions",
              render: (record: Brand) => (
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
                    {user.role === "Admin" && (
                      <ActionIcon
                        color="red"
                        component="button"
                        onClick={() => {
                          setOpened(true), setDeleteBrand(record);
                        }}
                      >
                        <Trash size={18} />
                      </ActionIcon>
                    )}
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
          setImage("");
          form.reset();
          setApplyToProducts(true);
        }}
        title={form.values._id ? "Update Brand Details" : "Add Brand Details"}
        size="lg"
      >
        <form onSubmit={handleSubmit}>
          <TextInput
            label="Brand Name"
            placeholder="Brand Name"
            required
            {...form.getInputProps("title")}
          />
          <input
            type="file"
            id="file"
            className="inputfile"
            onChange={(e: any) => {
              if (e.target.files[0]) {
                const file = e.target.files[0];
                form.setFieldValue("file", file);
                const reader = new FileReader();
                reader.addEventListener("load", () => {
                  setImage((prev: any) => (prev = reader.result));
                });
                reader.readAsDataURL(file);
              }
            }}
          />
          <label style={{ marginTop: "10px" }} htmlFor="file">
            <p>Image</p>
            <img
              src={image || form.values.imageURL || placeholder}
              alt={form.values.title}
              style={{ width: "200px" }}
            />
          </label>

          {/* Changed cols to 3 to accomodate new checkbox */}
          <SimpleGrid mt={"xs"} cols={3}>
            <Checkbox
              label="is Feature"
              {...form.getInputProps("isFeatured", { type: "checkbox" })}
            />
            <Checkbox
              label="is Active"
              {...form.getInputProps("isActive", { type: "checkbox" })}
            />
            {/* NEW: Apply to all related products checkbox */}
            <Checkbox
              label="Apply to all related products (set all products active/inactive)"
              checked={applyToProducts}
              onChange={(e) => setApplyToProducts(e.currentTarget.checked)}
            />
          </SimpleGrid>

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
          <Select
            label="Is Featured"
            mt={"xs"}
            data={[
              { label: "All", value: "" },
              { label: "Yes", value: "true" },
              { label: "No", value: "false" },
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
              { label: "Yes", value: "true" },
              { label: "No", value: "false" },
            ]}
            placeholder="Is Active"
            {...filterForm.getInputProps("isActive")}
            clearable
          />
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
        _id={deleteBrand?._id}
        apiPoint={BRANDS}
        refetch={refetch}
        title={`Are you sure you want to delete ${deleteBrand?.title} Brand?`}
        onClose={() => {
          setOpened(false), setDeleteBrand(null);
        }}
      />
    </>
  );
}


