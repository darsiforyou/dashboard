import {
  Button,
  createStyles,
  TextInput,
  Title,
  useMantineTheme,
  Select,
  Drawer,
} from "@mantine/core";
import { FormEvent, useEffect, useState } from "react";
import { TbPlus } from "react-icons/tb";
import { z } from "zod";
import { useForm, zodResolver } from "@mantine/form";
import axiosConfig from "../configs/axios";
import {
  GET_CATEGORIES_WITHOUT_FILTER,
  GET_BRANDS_WITHOUT_FILTER,
  GET_USERS_WITHOUT_FILTER,
  PRODUCTS,
  GET_SUBJECTS_WITHOUT_FILTER,
  BRANDS,
} from "../utils/API_CONSTANT";
import { AxiosResponse } from "axios";
import { useQuery } from "react-query";
import ProductsList from "../components/ProductsList";
import ProductModal from "../components/ProductModal";
import { useLocation, useSearchParams } from "react-router-dom";

type Props = {};

const schema = z.object({
  _id: z.string(),
  imageURL: z.string(),
  imageId: z.string(),
  media: z.any(),
  isbn: z.string().min(10, { message: "ISBN be 10 characters long" }),
  targetAge: z.number(),
  subject: z.string(),
  title: z
    .string()
    .min(2, { message: "Name should have at least 2 letters" })
    .trim(),
  category: z.string(),
  brand: z.string(),
  otherBrandName: z.string(),
  tags: z.string(),
  options: z.any(),
  vendor: z.string(),
  vendorPrice: z.number(),
  price: z.number(),
  available: z.boolean(),
  isActive: z.boolean(),
  isFeatured: z.boolean(),
  stockCountPending: z.number(),
  productCode: z.string(),
  description: z.string().trim(),
});

const useStyles = createStyles((theme) => ({
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: "16px",
  },
}));

type Product = z.infer<typeof schema>;

const fetchProducts = async ({ queryKey }: any) => {
  const [_, { search, page, limit, ...filters }] = queryKey;
  const params = new URLSearchParams(filters);
  const res: AxiosResponse = await axiosConfig.get(
    `${PRODUCTS}?search=${search}&page=${page}&limit=${limit}&${params}`
  );
  const data = res.data;
  return data;
};

export function Products({}: Props) {
  const user = JSON.parse(sessionStorage.getItem("user") || "{}");
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [openedDrawer, setOpenedDrawer] = useState(false);
  const [filterProducts, setFilterProducts]: any = useState([]);

  // adnan edited
  const location = useLocation();
  let [searchParams, setSearchParams] = useSearchParams();
  let params: Record<string, string | null> = {};

  for (let [key, value] of searchParams.entries()) {
    params[key] = value;
  }

  // adnan edited
  const [options, setOptions] = useState({
    color: { value: "color", lastValue: "", values: [] },
    size: { value: "size", lastValue: "", values: [] },
    material: {
      value: "material",

      lastValue: "",
      values: [],
    },
    style: { value: "style", lastValue: "", values: [] },
  });
  const [filters, setfilters] = useState({
    search: "",
    limit: 10,
    page: params?.page ?? "",
    productCode: "",
    available: "",
    isActive: params?.isActive ?? "",
    isFeatured: params?.isFeatured ?? "",
    category: "",
    brand: "",
    vendor: user.role !== "Admin" ? user._id : "",
  });

  const {
    isLoading,
    error,
    data: products,
    refetch,
  } = useQuery(["products", filters], fetchProducts, {
    enabled: true,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (!isLoading) {
      let pro = products?.data;
      setFilterProducts(pro);
    }
  }, [isLoading, products]);

  const { classes } = useStyles();
  const [isAddModalOpened, setIsAddModalOpened] = useState(false);

  const fetchBrands = async () => {
    const userId = user.role === "Vendor" ? user._id : "";
    const res: AxiosResponse = await axiosConfig.get(
      `${BRANDS}?limit=1000&userId=${userId}`
    );
    const data = res.data.data.docs;
    const brands = data.map((brand: any) => ({
      value: brand._id,
      label: brand.title,
    }));
    brands.push({
      value: "other",
      label: "Other",
    });
    setBrands(brands);
  };
  const fetchSubjects = async () => {
    const res: AxiosResponse = await axiosConfig.get(
      GET_SUBJECTS_WITHOUT_FILTER
    );
    const data = res.data;
    const subjects = data.map((subject: any) => ({
      value: subject._id,
      label: subject.title,
    }));

    setSubjects(subjects);
  };
  const fetchCategories = async () => {
    const res: AxiosResponse = await axiosConfig.get(
      GET_CATEGORIES_WITHOUT_FILTER
    );
    const data = res.data;
    const categories = data.map((category: any) => ({
      value: category._id,
      label: category.title,
    }));
    setCategories(categories);
  };
  const fetchUsers = async () => {
    if (user.role !== "Admin") return;
    const res: AxiosResponse = await axiosConfig.get(
      GET_USERS_WITHOUT_FILTER + "?role=Vendor"
    );
    const data = res.data;
    const users = data.map((x: any) => ({
      value: x._id,
      label: x.firstname + " " + x.lastname,
    }));
    setUsers(users);
  };

  const theme = useMantineTheme();
  useEffect(() => {
    fetchUsers();
    fetchCategories();
    fetchBrands();
    fetchSubjects();
  }, []);

  const form = useForm({
    validate: zodResolver(schema),
    initialValues: {
      _id: "",
      title: "",
      isbn: "",
      subject: undefined,
      media: [],
      options: [],
      imageURL: "",
      imageId: "",
      category: "",
      brand: "",
      otherBrandName: "",
      tags: "",
      vendor: "",
      vendorPrice: null,
      price: null,
      available: false,
      isActive: false,
      isFeatured: false,
      stockCountPending: null,
      description: "",
    },
  });

  const filterFormInit = {
    productCode: "",
    category: "",
    available: "",
    isActive: params?.isActive ?? "",
    isFeatured: params?.isFeatured ?? "",
    vendor: user.role === "Vendor" ? user._id : "",
    targetAge: "",
  };
  const filterForm = useForm({
    initialValues: filterFormInit,
  });
  const handleFilterForm = async (e: FormEvent) => {
    e.preventDefault();
    const values = filterForm.values;
    if (user.role === "Vendor") {
      values.vendor = user._id;
    }
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
      let _options: any = {};

      (data.options || []).forEach((option: any) => {
        _options[option.key] = {
          value: option.key,
          lastValue: "",
          values: option.values || [],
        };
      });

      setOptions((prev) => ({
        ...prev,
        ..._options,
      }));

      form.setValues({ ...data, isbn: parseInt(data.isbn) });
    }
  };

  return (
    <>
      <div className={classes.header}>
        <Title>Products</Title>
        <Button
          onClick={() => handleOpenModal()}
          leftIcon={<TbPlus size={18} />}
        >
          Add Product
        </Button>
      </div>
      <ProductsList
        filterProducts={filterProducts}
        isLoading={isLoading}
        setOpenedDrawer={setOpenedDrawer}
        setfilters={setfilters}
        refetch={refetch}
        filters={filters}
        user={user}
        handleOpenModal={handleOpenModal}
      />
      <ProductModal
        form={form}
        refetch={refetch}
        users={users}
        isAddModalOpened={isAddModalOpened}
        setIsAddModalOpened={setIsAddModalOpened}
        categories={categories}
        brands={brands}
        subjects={subjects}
        user={user}
        options={options}
        setOptions={setOptions}
      />
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
            label="Product Code"
            placeholder="Product Code"
            {...filterForm.getInputProps("productCode")}
          />
          <Select
            label="Category"
            mt={"xs"}
            data={categories || []}
            placeholder="Category"
            {...filterForm.getInputProps("category")}
            clearable
          />
          <Select
            label="Brand"
            mt={"xs"}
            data={brands || []}
            placeholder="Brand"
            {...filterForm.getInputProps("brand")}
            clearable
          />
          {user.role === "Admin" && (
            <Select
              label="Vendor"
              mt={"xs"}
              data={users || []}
              placeholder="Vendor"
              {...filterForm.getInputProps("vendor")}
              clearable
            />
          )}
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
          <Select
            label="Is Active"
            mt={"xs"}
            data={[
              { label: "All", value: "" },
              { label: "Yes", value: "true" },
              { label: "No", value: "false" },
            ]}
            placeholder="Is Active"
            {...filterForm.getInputProps("isFeatured")}
            clearable
          />
          <Select
            label="Available"
            mt={"xs"}
            data={[
              { label: "All", value: "" },
              { label: "Yes", value: "true" },
              { label: "No", value: "false" },
            ]}
            placeholder="Available"
            {...filterForm.getInputProps("available")}
            clearable
          />
          <Select
            label="Age"
            data={["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"]}
            placeholder="Select age"
            clearable
            {...filterForm.getInputProps("targetAge")}
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
                vendor: user.role === "Vendor" ? user._id : prev.vendor,
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
    </>
  );
}
