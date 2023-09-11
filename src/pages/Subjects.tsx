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
import { SUBJECTS } from "../utils/API_CONSTANT";
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
  isActive: z.boolean(),
});

const useStyles = createStyles((theme) => ({
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
  },
}));

type Subject = z.infer<typeof schema>;

const fetchTableData = async ({ queryKey }: any) => {
  const [_, { search, page, limit, ...filters }] = queryKey;
  const params = new URLSearchParams(filters);
  const res: AxiosResponse = await axiosConfig.get(
    `${SUBJECTS}?search=${search}&page=${page}&limit=${limit}&${params}`
  );
  const data = res.data;
  return data;
};

export function Subjects({}: Props) {
  const [opened, setOpened] = useState(false);
  const [deleteSubject, setDeleteSubject] = useState<Subject | null>(null);
  const [openedDrawer, setOpenedDrawer] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [filters, setfilters] = useState({
    search: "",
    limit: 10,
    page: 1,
    productCode: "",
    subject: "",
    isActive: "",
  });

  const {
    isLoading,
    error,
    data: subjects,
    refetch,
  } = useQuery(["subjects", filters], fetchTableData, {
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
      isActive: false,
    },
  });

  const filterFormInit = {
    isActive: "",
  };
  const filterForm = useForm({
    initialValues: filterFormInit,
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
    let subjectAddOrUpdateTitle = "";

    if (values._id) {
      res = await axiosConfig.put(
        SUBJECTS + "/" + values._id,
        formData,
        options
      );
      subjectAddOrUpdateTitle = "Subject updated";
    } else {
      res = await axiosConfig.post(SUBJECTS, formData, options);
      subjectAddOrUpdateTitle = "Subject Added";
    }

    if (res?.status === 200) {
      setIsAddModalOpened(false);
      form.reset();
      refetch();
      setImage("");
      showNotification({
        title: subjectAddOrUpdateTitle,
        message: res.data.message,
        icon: <IconCheck />,
        color: "teal",
      });
    }
    setSubmitting(false);
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
    const res = await axiosConfig.delete(SUBJECTS + "/" + id, options);
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
        <Title>Subjects</Title>
        <Button
          onClick={() => handleOpenModal()}
          leftIcon={<TbPlus size={18} />}
        >
          Add Subject
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
          withColumnBorders
          striped
          highlightOnHover
          columns={[
            {
              accessor: "index",
              title: "#",
              textAlignment: "right",
              width: 40,
              render: (record) => subjects?.data?.docs.indexOf(record) + 1,
            },
            {
              accessor: "title",
            },
            {
              accessor: "imageURL",
              render: (record: Subject) => (
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
              render: ({ isActive }: Subject) => (
                <span>{isActive ? "Yes" : "No"}</span>
              ),
            },
            {
              accessor: "actions",
              render: (record: Subject) => (
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
                        setOpened(true), setDeleteSubject(record);
                      }}
                    >
                      <Trash size={18} />
                    </ActionIcon>
                  </Group>
                </>
              ),
            },
          ]}
          idAccessor="_id"
          records={subjects?.data?.docs}
        />
      </Box>
      <Modal
        opened={isAddModalOpened}
        onClose={() => {
          setIsAddModalOpened(false);
          setImage("");

          form.reset();
        }}
        title={
          form.values._id ? "Update Subject Details" : "Add Subject Details"
        }
        size="lg"
      >
        <form onSubmit={handleSubmit}>
          <TextInput
            label="Subject Name"
            placeholder="Subject Name"
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

          <SimpleGrid mt={"xs"} cols={2}>
            <Checkbox
              label="is Active"
              {...form.getInputProps("isActive", { type: "checkbox" })}
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
        _id={deleteSubject?._id}
        apiPoint={SUBJECTS}
        refetch={refetch}
        title={`Are you sure you want to delete ${deleteSubject?.title} Subject?`}
        onClose={() => {
          setOpened(false), setDeleteSubject(null);
        }}
      />
    </>
  );
}
