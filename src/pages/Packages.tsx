import {
  Button,
  createStyles,
  Modal,
  TextInput,
  Title,
  SimpleGrid,
  useMantineTheme,
  Image,
  Text,
  Drawer,
  Input,
  Box,
  Group,
  ActionIcon,
} from "@mantine/core";
import { FormEvent, useState } from "react";
import { TbPlus } from "react-icons/tb";
import { z } from "zod";
import { useForm, zodResolver } from "@mantine/form";
import axiosConfig from "../configs/axios";
import { PACKAGES } from "../utils/API_CONSTANT";
import { AxiosResponse } from "axios";
import { getFormData } from "../utils/getFormData";
import { useQuery } from "react-query";
import { DataTable } from "mantine-datatable";
import { Column } from "primereact/column";
import { Pencil, Trash, Search, Filter, Edit } from "tabler-icons-react";
import placeholder from "../assets/placeholder.png";
import RichTextEditor from "@mantine/rte";
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
  description: z.string().trim(),
  valid_time: z.string(),
  price: z.number(),
  discount_percentage: z.string(),
  commission: z.string(),
});

const useStyles = createStyles((theme) => ({
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
  },
}));

type Package = z.infer<typeof schema>;

const fetchTableData = async ({ queryKey }: any) => {
  const [_, { search, page, limit }] = queryKey;
  const res: AxiosResponse = await axiosConfig.get(
    `${PACKAGES}?search=${search}&page=${page}&limit=${limit}`
  );
  const data = res.data;
  return data;
};

export function Packages({}: Props) {
  const [opened, setOpened] = useState(false);
  const [deletePackage, setDeletePackage] = useState<Package | null>(null);
  const [openedDrawer, setOpenedDrawer] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [filters, setfilters] = useState({
    search: "",
    limit: 10,
    page: 1,
  });

  const {
    isLoading,
    error,
    data: packages,
    refetch,
  } = useQuery(["packages", filters], fetchTableData, {
    enabled: true,
    refetchOnWindowFocus: false,
  });

  const { classes } = useStyles();
  const [isAddModalOpened, setIsAddModalOpened] = useState(false);
  const [image, setImage]: any = useState("");

  const theme = useMantineTheme();

  const form = useForm({
    validate: zodResolver(schema),
    initialValues: {
      _id: "",
      title: "",
      file: null,
      imageURL: "",
      imageId: "",
      description: "",
      valid_time: "",
      discount_percentage: "",
      price: undefined,
      commission: "",
    },
  });

  const filterForm = useForm({
    validate: zodResolver(schema),
    initialValues: {
      productCode: "",
    },
  });
  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const values = form.values;
    setSubmitting(true);
    const formData = getFormData(values);
    const options = {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    };
    let res;
    let packageAddOrUpdateTitle = "";

    if (values._id) {
      res = await axiosConfig.put(
        PACKAGES + "/" + values._id,
        formData,
        options
      );
      packageAddOrUpdateTitle = "package Updated";
    } else {
      res = await axiosConfig.post(PACKAGES, formData, options);
      packageAddOrUpdateTitle = "package Added";
    }
    if (res?.status === 200) {
      setSubmitting(false);
      setIsAddModalOpened(false);
      refetch();
      form.reset();
      showNotification({
        title: packageAddOrUpdateTitle,
        message: res.data.message,
        icon: <IconCheck />,
        color: "teal",
      });
    }
  }
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
    const res = await axiosConfig.delete(PACKAGES + "/" + id, options);
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
          <Input
            icon={<Search />}
            placeholder="Search"
            value={filters.search}
            onChange={onGlobalFilterChange}
            style={{ width: "fit-content" }}
          />
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
  const handleFilters = (value: string, field: string) => {
    setfilters((prev: any) => ({ ...prev, [field]: value }));
  };
  return (
    <>
      <div className={classes.header}>
        <Title>Packages</Title>
        <Button
          onClick={() => handleOpenModal()}
          leftIcon={<TbPlus size={18} />}
        >
          Add Package
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
      <Box sx={{ maxHeight: "70vh" }}>
        <DataTable
          withBorder
          withColumnBorders
          striped
          highlightOnHover
          minHeight={"150px"}
          page={packages?.data?.page}
          onPageChange={onPagination}
          totalRecords={packages?.data?.totalDocs}
          recordsPerPage={filters.limit}
          idAccessor="_id"
          fontSize="sm"
          records={packages?.data?.docs}
          fetching={isLoading}
          columns={[
            {
              accessor: "index",
              title: "#",
              textAlignment: "right",
              width: 40,
              render: (record: Package) =>
                packages?.data?.docs.indexOf(record) + 1,
            },
            {
              accessor: "title",
            },
            {
              accessor: "imageURL",
              render: (record) => (
                <Image
                  width={150}
                  height={100}
                  fit="contain"
                  src={record.imageURL}
                  alt={record.title}
                  withPlaceholder
                />
              ),
            },
            {
              accessor: "valid_time",
            },
            {
              accessor: "price",
            },
            {
              accessor: "discount_percentage",
            },
            {
              accessor: "commission",
            },
            {
              accessor: "actions",
              render: (record: Package) => (
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
                      setOpened(true), setDeletePackage(record);
                    }}
                  >
                    <Trash size={18} />
                  </ActionIcon>
                </Group>
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
          form.values._id ? "Update Package Details" : "Add Package Details"
        }
        size="lg"
      >
        <form onSubmit={handleSubmit}>
          <TextInput
            label="Package Name"
            placeholder="Package Name"
            required
            {...form.getInputProps("title")}
          />
          <TextInput
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
            <p style={{border:"1px solid #ced4da",width:"100%" , padding: "5px" , borderRadius:"2px"}}>
              Update Image here
               </p>
            {/* <span style={{border:"2px solid gray",width:"100%"}}> */}
            <img
              src={image || form.values.imageURL || placeholder}
              alt={form.values.title}
              style={{ width: "300px" ,height:"100px" }}
            />
            {/* </span> */}
          </label>

          <SimpleGrid mt={"xs"} cols={2}>
            <TextInput
              label="Valid Time"
              placeholder="Valid Time"
              required
              {...form.getInputProps("valid_time")}
            />
            <TextInput
              label="Price"
              placeholder="Price"
              required
              {...form.getInputProps("price")}
            />
          </SimpleGrid>
          <SimpleGrid mt={"xs"} cols={2}>
            <TextInput
              label="Discount %"
              description="(discount given to customer)"
              placeholder="Discount %"
              required
              {...form.getInputProps("discount_percentage")}
            />
            <TextInput
              label="Commission"
              placeholder="Commission"
              description="(commission given to referrer)"
              required
              {...form.getInputProps("commission")}
            />
          </SimpleGrid>
          <Text style={{ marginTop: "10px" }}>Description</Text>
          <RichTextEditor
            controls={[
              ["bold", "italic", "underline", "link"],
              ["unorderedList", "h1", "h2", "h3"],
              ["sup", "sub"],
              ["alignLeft", "alignCenter", "alignRight"],
            ]}
            {...form.getInputProps("description")}
          />
          <Button loading={submitting} type="submit" fullWidth my={"sm"}>
            Submit
          </Button>
        </form>
      </Modal>
      <ConfirmModal
        opened={opened}
        _id={deletePackage?._id}
        apiPoint={PACKAGES}
        refetch={refetch}
        title={`Are you sure you want to delete ${deletePackage?.title} Package?`}
        onClose={() => {
          setOpened(false), setDeletePackage(null);
        }}
      />
    </>
  );
}
