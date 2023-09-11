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
  Text,
  Box,
  Group,
  ActionIcon,
  FileInput,
} from "@mantine/core";
import { FormEvent, useState } from "react";
import { TbPlus } from "react-icons/tb";
import { z } from "zod";
import { useForm, zodResolver } from "@mantine/form";
import axiosConfig from "../configs/axios";
import { DASHBOARD_SETTING } from "../utils/API_CONSTANT";
import { AxiosResponse } from "axios";
import { getFormData } from "../utils/getFormData";
import { useQuery } from "react-query";
import { DataTable } from "mantine-datatable";
// import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Pencil, Trash, Search, Filter, Edit } from "tabler-icons-react";
import placeholder from "../assets/placeholder.png";
import RichTextEditor from "@mantine/rte";
import { DashboardSetting } from "../Types/types";

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
  btn_text: z.string(),
  sub_title: z.string(),
});

const useStyles = createStyles((theme) => ({
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
  },
}));

type DashboardSettings = z.infer<typeof schema>;

const fetchTableData = async ({ queryKey }: any) => {
  const [_, { search, page, limit }] = queryKey;
  const res: AxiosResponse = await axiosConfig.get(
    `${DASHBOARD_SETTING}?search=${search}&page=${page}&limit=${limit}`
  );
  const data = res.data;
  return data;
};

export function DashboardSettings({}: Props) {
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
    data: DS,
    refetch,
  } = useQuery(["DS", filters], fetchTableData, {
    enabled: true,
    //keepPreviousData: true,
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
      btn_text: "",
      sub_title: "",
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
    if (values._id) {
      res = await axiosConfig.put(
        DASHBOARD_SETTING + "/" + values._id,
        formData,
        options
      );
    } else {
      res = await axiosConfig.post(DASHBOARD_SETTING, formData, options);
    }
    if (res?.status === 200) {
      setSubmitting(false);
      setIsAddModalOpened(false);
      form.reset();
      refetch();
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
    const res = await axiosConfig.delete(DASHBOARD_SETTING + "/" + id, options);
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
        <Title>Dashboard Settings</Title>
        <Button
          onClick={() => handleOpenModal()}
          leftIcon={<TbPlus size={18} />}
        >
          Add Settings
        </Button>
      </div>
      {/* <DataTable
        value={DS?.data?.docs}
        dataKey="id"
        onPage={onPagination}
        totalRecords={DS?.data?.totalDocs}
        loading={isLoading}
        lazy
        header={renderHeader}
        responsiveLayout="scroll"
        paginator
        paginatorTemplate="CurrentPageReport FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown"
        currentPageReportTemplate="Showing {first} to {last} of {totalRecords}"
        rows={filters.limit}
        rowsPerPageOptions={[10, 20, 50]}
        emptyMessage="No DS found."
      >
        <Column field="title" header="Title"></Column>
        <Column field="sub_title" header="Sub Title"></Column>
        <Column
          field="imageURL"
          header="Image"
          body={({ imageURL, title }) => (
            <Image
              width={100}
              height={100}
              src={imageURL}
              alt={title}
              withPlaceholder
            />
          )}
        ></Column>
        <Column
          headerStyle={{ width: "4rem", textAlign: "center" }}
          bodyStyle={{
            textAlign: "center",
            overflow: "visible",
            display: "flex",
            justifyContent: "space-between",
          }}
          header="Action"
          body={actionBodyTemplate}
        />
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
          page={DS?.data?.page}
          onPageChange={onPagination}
          totalRecords={DS?.data?.totalDocs}
          recordsPerPage={filters.limit}
          idAccessor="_id"
          fontSize="sm"
          fetching={isLoading}
          records={DS?.data?.docs}
          columns={[
            {
              accessor: "index",
              title: "#",
              textAlignment: "right",
              width: 40,
              render: (record: DashboardSetting) =>
                DS?.data?.docs.indexOf(record) + 1,
            },
            {
              accessor: "title",
            },
            {
              accessor: "sub_title",
            },
            {
              accessor: "imageURL",
              render: (record: DashboardSetting) => (
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
              accessor: "actions",
              render: (record: DashboardSetting) => (
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
                      onClick={() => handleDelete(record._id)}
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
        title={form.values._id ? "Update DS Details" : "Add DS Details"}
        size="lg"
      >
        <form onSubmit={handleSubmit}>
          <TextInput
            label="Title"
            placeholder="Title"
            required
            {...form.getInputProps("title")}
          />

          <SimpleGrid mt={"xs"} cols={2}>
            <TextInput
              label="Sub Title"
              placeholder="Sub Title"
              required
              {...form.getInputProps("sub_title")}
            />
            <TextInput
              label="Button"
              placeholder="Button"
              required
              {...form.getInputProps("btn_text")}
            />
          </SimpleGrid>
          <FileInput
            placeholder="Pick file"
            label="Banner image"
            withAsterisk
            required
            my={"md"}
            accept="image/png,image/jpeg,image/jpg"
            styles={{
              input: {
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              },
            }}
            // style={{ overflow: "hidden" }}
            {...form.getInputProps("file")}
          />

          {form.values.file ? (
            <Image
              width={"200"}
              mx={"auto"}
              styles={{ image: { objectFit: "contain" } }}
              src={URL.createObjectURL(form.values.file)}
            />
          ) : (
            <Image
              width={"100%"}
              height={120}
              src={null}
              alt="With default placeholder"
              withPlaceholder
            />
          )}

          {/* <input
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
          </label> */}
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
    </>
  );
}
