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
  Box,
  ActionIcon,
  Group,
  FileInput,
  NumberInput,
} from "@mantine/core";
import { FormEvent, useEffect, useState } from "react";
import { TbPlus } from "react-icons/tb";
import { z } from "zod";
import { useForm, zodResolver } from "@mantine/form";
import axiosConfig from "../configs/axios";
import { CATEGORIES } from "../utils/API_CONSTANT";
import { AxiosResponse } from "axios";
import { getFormData } from "../utils/getFormData";
import { useQuery } from "react-query";
// import { DataTable } from "primereact/datatable";
import { DataTable } from "mantine-datatable";
import { Column } from "primereact/column";
import { Pencil, Trash, Search, Filter, Edit } from "tabler-icons-react";
import placeholder from "../assets/placeholder.png";
import { showNotification } from "@mantine/notifications";
import { IconCheck, IconUpload } from "@tabler/icons";
import { ConfirmModal } from "../components/ConfirmModal";

type Props = {};

const schema = z
  .object({
    _id: z.string(),
    imageURL: z.string(),
    imageId: z.string(),
    title: z
      .string()
      .trim()
      .min(2, { message: "Category should have at least 2 letters" }),
    file: z.any(),
    parentId: z.string(),
    isFeatured: z.boolean(),
    isActive: z.boolean(),
    rank: z.number().min(0),
  })
  .superRefine((val, ctx) => {
    if (!val.imageURL) {
      if (!(val.file instanceof File)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "File is required",
          path: ["file"],
          fatal: true,
        });
      }

      if (
        val.file instanceof File &&
        val.file?.size <= 0 &&
        val.file?.size >= 2000
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "File size should be less than eq 2MB",
          path: ["file"],
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

type Category = z.infer<typeof schema>;

const fetchTableData = async ({ queryKey }: any) => {
  const [_, { search, page, limit, ...filters }] = queryKey;
  const params = new URLSearchParams(filters);
  const res: AxiosResponse = await axiosConfig.get(
    `${CATEGORIES}?search=${search}&page=${page}&limit=${limit}&${params}`
  );
  const data = res.data;
  return data;
};

const fetchCategories = async () => {
  const res = await axiosConfig.get(`${CATEGORIES}/without_filter`);
  const data = res.data;
  return data;
};
export function Categories({}: Props) {
  const [opened, setOpened] = useState(false);
  const [deleteCategory, setDeleteCategory] = useState<Category | null>(null);
  const [openedDrawer, setOpenedDrawer] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [filters, setfilters] = useState({
    search: "",
    limit: 10,
    page: 1,
    productCode: "",
    category: "",
    isFeatured: "",
    isActive: "",
  });
  // function createCategories(categories: any, parentId = null): any {
  //   const categoryList = [];
  //   let category;
  //   if (parentId == null) {
  //     category = categories.filter((cat: any) => cat.parentId == undefined);
  //   } else {
  //     category = categories.filter((cat: any) => cat.parentId == parentId);
  //   }

  //   for (let cate of category) {
  //     categoryList.push({
  //       _id: cate._id,
  //       title: cate.title,
  //       slug: cate.slug,
  //       parentId: cate.parentId,
  //       isActive: cate.isActive,
  //       isFeatured: cate.isFeatured,
  //       // type: cate.type,
  //       children: createCategories(categories, cate._id),
  //     });
  //   }

  //   return categoryList;
  // }

  const {
    isLoading,
    error,
    data: categories,
    refetch,
  } = useQuery(["categories", filters], fetchTableData, {
    enabled: true,
    refetchOnWindowFocus: false,
  });
  const [categoriesDropdown, setCategoriesDropdown] = useState([]);
  const {
    data: categoriesWithOutFilter,
    isLoading: isLoadingcategoriesWithOutFilter,
  } = useQuery(["categoriesWithOutFilter"], fetchCategories);
  useEffect(() => {
    if (!isLoadingcategoriesWithOutFilter) {
      const cats = categoriesWithOutFilter.map((category: any) => ({
        ...category,
        value: category._id,
        label: category.title,
      }));
      setCategoriesDropdown(cats);
    }
  }, [categoriesWithOutFilter]);

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
      isFeatured: false,
      isActive: false,
      rank: 0,
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
    setSubmitting(true);
    const formData = getFormData(values);
    const options = {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    };
    let res;
    let categoryAddOrUpdateTitle = "";

    if (values._id) {
      res = await axiosConfig.put(
        CATEGORIES + "/" + values._id,
        formData,
        options
      );
      categoryAddOrUpdateTitle = "Category Added";
    } else {
      res = await axiosConfig.post(CATEGORIES, formData, options);
      categoryAddOrUpdateTitle = "Category Added";
    }

    if (res?.status === 200) {
      setSubmitting(false);
      setIsAddModalOpened(false);
      form.reset();
      refetch();
      showNotification({
        title: categoryAddOrUpdateTitle,
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
    const res = await axiosConfig.delete(CATEGORIES + "/" + id, options);
    const data = res.data;
    if (res.status === 200) {
      setSubmitting(false);
      setIsAddModalOpened(false);
      refetch();
      // form.reset();
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
        <Button
          size="xs"
          type="button"
          disabled={rowData._id === "635d7aa623840ef068eb748f"}
        >
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
        <Title>Categories</Title>
        <Button
          onClick={() => handleOpenModal()}
          leftIcon={<TbPlus size={18} />}
        >
          Add Category
        </Button>
      </div>
      {/* <DataTable
        value={categories?.data?.docs}
        dataKey="id"
        onPage={onPagination}
        totalRecords={categories?.data?.totalDocs}
        loading={isLoading}
        lazy
        header={renderHeader}
        responsiveLayout="scroll"
        paginator
        paginatorTemplate="CurrentPageReport FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown"
        currentPageReportTemplate="Showing {first} to {last} of {totalRecords}"
        rows={filters.limit}
        rowsPerPageOptions={[10, 20, 50]}
        emptyMessage="No Category found."
      >
        <Column field="title" header="Title"></Column>
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
        <Column field="rank" header="Category Rank"></Column>
        <Column
          field="isActive"
          header="Is Active"
          body={({ isActive }) => <span>{isActive ? "Yes" : "No"}</span>}
        ></Column>
        <Column
          field="isFeatured"
          header="Is Featured"
          body={({ isFeatured }) => <span>{isFeatured ? "Yes" : "No"}</span>}
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
      <Box sx={{ height: "70vh" }}>
        <DataTable
          withBorder
          withColumnBorders
          striped
          highlightOnHover
          minHeight={"150px"}
          page={categories?.data?.page}
          onPageChange={onPagination}
          totalRecords={categories?.data?.totalDocs}
          recordsPerPage={filters.limit}
          idAccessor="_id"
          fontSize="sm"
          records={categories?.data?.docs}
          fetching={isLoading}
          columns={[
            {
              accessor: "_id",
              title: "#",
              textAlignment: "right",
              width: 40,
              render: (record: Category) =>
                categories?.data?.docs.indexOf(record) + 1,
            },
            {
              accessor: "title",
            },
            {
              accessor: "imageURL",
              title: "Image",
              render: ({ imageURL, title }: Category) => (
                <Image width={100} src={imageURL} alt={title} withPlaceholder />
              ),
            },
            {
              accessor: "isActive",
              width: 100,
              render: ({ isActive }: Category) => (
                <>{isActive ? "Yes" : "No"}</>
              ),
            },
            {
              accessor: "isFeatured",
              width: 100,
              render: ({ isFeatured }: Category) => (
                <>{isFeatured ? "Yes" : "No"}</>
              ),
            },
            {
              accessor: "actions",

              render: (record: Category) => (
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
                        setOpened(true), setDeleteCategory(record);
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
          form.values._id ? "Update Category Details" : "Add Category Details"
        }
        size="lg"
      >
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <TextInput
            label="Category Name"
            placeholder="Category Name"
            withAsterisk
            {...form.getInputProps("title")}
          />
          <Select
            data={categoriesDropdown ? categoriesDropdown : []}
            placeholder="Parent Category"
            searchable
            label="Parent Category"
            my={"xs"}
            {...form.getInputProps("parentId")}
          />
          <NumberInput
            label="Category Rank (1-10)"
            type="number"
            placeholder="Category Rank for Home Page"
            {...form.getInputProps("rank")}
          />{" "}
          <FileInput
            placeholder="Pick file"
            label="Banner image"
            withAsterisk
            my={"md"}
            accept="image/png,image/jpeg,image/jpg"
            required
            error={form.errors.file && "Please pick a file"}
            // error
            styles={{
              input: {
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              },
            }}
            icon={<IconUpload size={14} />}
            // style={{ overflow: "hidden" }}
            {...form.getInputProps("file")}
          />
          {form.values.file ? (
            <Box sx={{ maxHeight: "300px" }}>
              <Image
                width={200}
                mx={"auto"}
                styles={{ image: { objectFit: "contain" } }}
                src={URL.createObjectURL(form.values.file)}
              />
            </Box>
          ) : (
            <Box sx={{ maxHeight: "300px" }}>
              <Image
                width={200}
                height={!form.values.imageURL ? 120 : "auto"}
                sx={{ minHeight: "120px" }}
                mx={"auto"}
                src={form.values.imageURL ?? null}
                alt="With default placeholder"
                withPlaceholder
              />
            </Box>
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
          <SimpleGrid mt={"xs"} cols={2}>
            <Checkbox
              label="is Feature"
              {...form.getInputProps("isFeatured", { type: "checkbox" })}
            />
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
        _id={deleteCategory?._id}
        apiPoint={CATEGORIES}
        refetch={refetch}
        title={`Are you sure you want to delete ${deleteCategory?.title} category?`}
        onClose={() => {
          setOpened(false), setDeleteCategory(null);
        }}
      />
    </>
  );
}
