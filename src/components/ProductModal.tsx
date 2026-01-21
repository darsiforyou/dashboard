import {
  Accordion,
  ActionIcon,
  Box,
  Button,
  Checkbox,
  FileInput,
  Grid,
  Image,
  Modal,
  NumberInput,
  Select,
  SimpleGrid,
  Text,
  Textarea,
  TextInput,
} from "@mantine/core";
import React, { useState, FormEvent, useEffect } from "react";
import { CircleX, Minus, Plus } from "tabler-icons-react";
import axiosConfig from "../configs/axios";
import placeholder from "../assets/placeholder.png";
import { BRANDS, PRODUCTS } from "../utils/API_CONSTANT";
import { getFormData } from "../utils/getFormData";
import { showNotification } from "@mantine/notifications";
import { IconCheck } from "@tabler/icons";

function ProductModal({
  form,
  refetch,
  users,
  isAddModalOpened,
  setIsAddModalOpened,
  categories,
  brands,
  user,
  setOptions,
  options,
  subjects,
}: any) {
  const [submitting, setSubmitting] = useState(false);
  const [isOtherBrand, setIsOtherBrand] = useState(false);
  const [lastEditedField, setLastEditedField] = useState<string | null>(null);


  const [priceFieldChanges, setPriceFieldChanges] = useState({
  price: false,
  vendorPrice: false,
  discountPrice: false
});

  // 当 price 或 vendorPrice 变化时，自动计算 discount
  useEffect(() => {
    const price = parseFloat(form.values.price);
    const vendorPrice = parseFloat(form.values.vendorPrice);
    
    // 只有当最后编辑的不是 discountPrice 时才计算折扣
    if (lastEditedField !== 'discountPrice' && price && vendorPrice && vendorPrice > 0) {
      const discount = ((vendorPrice - price) / vendorPrice) * 100;
      form.setFieldValue('discountPrice', discount.toFixed(2));
    }
  }, [form.values.price, form.values.vendorPrice]);

  // 当 discount 变化时，自动计算 selling price
  useEffect(() => {
    const vendorPrice = parseFloat(form.values.vendorPrice);
    const discount = parseFloat(form.values.discountPrice);
    
    // 只有当最后编辑的是 discountPrice 时才计算价格
    if (lastEditedField === 'discountPrice' && vendorPrice && discount) {
      const calculatedPrice = vendorPrice - (vendorPrice * discount / 100);
      form.setFieldValue('price', calculatedPrice.toFixed(2));
    }
  }, [form.values.discountPrice]);

  // 处理字段变化的函数
const handlePriceFieldChange = (field: string, value: any) => {
  // موجودہ ویلیوز کو کاپی کریں
  const currentValues = { ...form.values };
  
  // جو فیلڈ تبدیل ہو رہی ہے اسے اپڈیٹ کریں
  currentValues[field] = value;
  
  // Parse کریں
  const price = field === 'price' ? (parseFloat(value) || 0) : (parseFloat(currentValues.price) || 0);
  const vendorPrice = field === 'vendorPrice' ? (parseFloat(value) || 0) : (parseFloat(currentValues.vendorPrice) || 0);
  const discountPrice = field === 'discountPrice' ? (parseFloat(value) || 0) : (parseFloat(currentValues.discountPrice) || 0);
  
  let newPrice = price;
  let newVendorPrice = vendorPrice;
  let newDiscountPrice = discountPrice;
  
  if (field === 'price') {
    const newPriceValue = parseFloat(value) || 0;
    newPrice = newPriceValue;
    
    // اگر price اور discount موجود ہوں تو cost price کیلکولیٹ کریں
    if (newPriceValue > 0 && discountPrice > 0) {
      newVendorPrice = newPriceValue * (100 - discountPrice) / 100;
    }
    // اگر price اور cost price موجود ہوں تو discount کیلکولیٹ کریں
    else if (newPriceValue > 0 && vendorPrice > 0) {
      newDiscountPrice = 100 - (vendorPrice * 100 / newPriceValue);
    }
  }
  else if (field === 'vendorPrice') {
    const newVendorPriceValue = parseFloat(value) || 0;
    newVendorPrice = newVendorPriceValue;
    
    // اگر cost price اور price موجود ہوں تو discount کیلکولیٹ کریں
    if (newVendorPriceValue > 0 && price > 0) {
      newDiscountPrice = 100 - (newVendorPriceValue * 100 / price);
    }
    // اگر cost price اور discount موجود ہوں تو price کیلکولیٹ کریں
    else if (newVendorPriceValue > 0 && discountPrice > 0) {
      newPrice = newVendorPriceValue * 100 / (100 - discountPrice);
    }
  }
  else if (field === 'discountPrice') {
    const newDiscountPriceValue = parseFloat(value) || 0;
    newDiscountPrice = newDiscountPriceValue;
    
    // اگر discount اور price موجود ہوں تو cost price کیلکولیٹ کریں
    if (newDiscountPriceValue >= 0 && price > 0) {
      newVendorPrice = price * (100 - newDiscountPriceValue) / 100;
    }
    // اگر discount اور cost price موجود ہوں تو price کیلکولیٹ کریں
    else if (newDiscountPriceValue >= 0 && vendorPrice > 0) {
      newPrice = vendorPrice * 100 / (100 - newDiscountPriceValue);
    }
  }
  
  // اب تمام تینوں فیلڈز ایک ساتھ اپڈیٹ کریں
  form.setValues({
    ...form.values,
    price: newPrice,
    vendorPrice: newVendorPrice,
    discountPrice: newDiscountPrice
  });
};
  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const { otherBrandName, ...values }: any = form.values;
    if (user.role === "Vendor") values.vendor = user._id;
    if (
      values.category === null ||
      values.category === undefined ||
      values.category.length === 0
    ) {
      return showNotification({
        autoClose: 5000,
        title: "Category Not Selected",
        message: "Please select a featured Image for product",
        color: "red",
      });
    }
    // if (form.error.media.length == 0) {
    // }
    if (values.media.length == 0) {
      form.error.media;
      showNotification({
        autoClose: 5000,
        title: "Feature image not selected",
        message: "Please upload an image",
        color: "red",
      });
      //  alert("Please select a image");
      return;
    }
    if (values.media && !values.media.some((x: any) => x.isFront)) {
      showNotification({
        autoClose: 5000,
        title: "Image not selected",
        message: "Please select a featured Image for product",
        color: "red",
      });
      //  alert("Please select a image");
      return;
    }
    if (values.category === "635d7aa623840ef068eb748f") {
      if (values.isbn) {
        if (values.isbn.length < 10 || values.isbn.length > 13) {
          return showNotification({
            autoClose: 5000,
            // title: "",
            message:
              "ISBN length sould be more or  less than 10 or 13 characters ",
            color: "red",
          });
        }
      }
    }

    // 验证价格逻辑
    const price = parseFloat(values.price);
    const vendorPrice = parseFloat(values.vendorPrice);
    const discountPrice = parseFloat(values.discountPrice);

    if (vendorPrice > price) {
      return showNotification({
        autoClose: 5000,
        message: "Cost price should not be higher than selling price",
        color: "red",
      });
    }

    if (price <= 0 || vendorPrice <= 0) {
      return showNotification({
        autoClose: 5000,
        message: "Prices should be greater than 0",
        color: "red",
      });
    }

    // if (discountPrice < 0 || discountPrice > 100) {
    //   return showNotification({
    //     autoClose: 5000,
    //     message: "Discount percentage should be between 0 and 100",
    //     color: "red",
    //   });
    // }

    // 验证计算出的折扣是否与实际折扣一致
    const calculatedDiscount = ((vendorPrice - price) / vendorPrice) * 100;
    if (Math.abs(calculatedDiscount - discountPrice) > 0.01) {
      return showNotification({
        autoClose: 5000,
        message: "Discount percentage does not match with selling and cost prices",
        color: "red",
      });
    }

    setSubmitting(true);

    // add other brands in the database
    if (isOtherBrand) {
      const brandFormData = getFormData({
        title: otherBrandName,
        isFeatured: false,
        isActive: true,
      });
      const options = {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      };
      let res: any = await axiosConfig.post(BRANDS, brandFormData, options);
      if (res?.status === 200) {
        values.brand = res.data.data._id;
        values.brand_name = res.data.data.title;
      }
    }

    const category: any = categories.find(
      (x: any) => x.value === values.category
    );
    const vendor: any = users.find((x: any) => x.value === values.vendor);
    const brand: any = brands.find((x: any) => x.value === values.brand);
    const subject: any = subjects.find((x: any) => x.value === values.subject);
    if (category) {
      values.category_name = category.label;
    }
    if (vendor) {
      values.vendor_name = vendor.label;
    }
    if (brand && !isOtherBrand) {
      values.brand_name = brand.label;
    }
    if (subject) {
      values.subject_name = subject.label;
    }
    values.options = [];
    Object.values(options).forEach((x: any) => {
      if (x.values && x.values.length > 0) {
        values.options.push({
          key: x.value,
          values: x.values,
        });
      }
    });
    let res;
    let productAddOrUpdateTitle = "";
    if (values._id) {
      res = await axiosConfig.put(PRODUCTS + "/" + values._id, values);
      productAddOrUpdateTitle = "Product updated";
    } else {
      res = await axiosConfig.post(PRODUCTS, values);
      productAddOrUpdateTitle = "Product Added";
    }
    if (res?.status === 200) {
      setOptions({
        color: { value: "color", lastValue: "", values: [] },
        size: { value: "size", lastValue: "", values: [] },
        material: {
          value: "material",

          lastValue: "",
          values: [],
        },
        style: { value: "style", lastValue: "", values: [] },
      });
      setIsAddModalOpened(false);
      refetch();
      showNotification({
        title: productAddOrUpdateTitle,
        message: res.data.message,
        icon: <IconCheck />,
        color: "teal",
      });
      form.reset();
      setLastEditedField(null);
    }
    if (res.data.error) {
      showNotification({
        title: "Product submission failed",
        message: res.data.errorMsg,
        color: "red",
      });
    }
    setSubmitting(false);
  }
  return (
    <Modal
      opened={isAddModalOpened}
      onClose={() => {
        setIsAddModalOpened(false);
        form.reset();
      }}
      title={form.values._id ? "Update Product Details" : "Add Product Details"}
      fullScreen
      overflow="outside"
      sx={{
        ".mantine-Modal-modal": {
          height: "100vh !important",
          overflow: "auto !important",
        },
      }}
    >
      <form onSubmit={handleSubmit}>
        <Grid columns={2}>
          <Grid.Col md={2} lg={1}>
            <TextInput
              label="Product Name"
              placeholder="Product Name"
              required
              {...form.getInputProps("title")}
            />
            <SimpleGrid mt={"xs"} cols={user.role !== "Vendor" ? 2 : 1}>
              {user.role !== "Vendor" ? (
                <Select
                  label="Vendor"
                  data={users || []}
                  placeholder="Vendor"
                  searchable
                  {...form.getInputProps("vendor")}
                  required
                />
              ) : null}
              <Select
                label="Category"
                data={categories || []}
                placeholder="Category"
                searchable
                {...form.getInputProps("category")}
                required
              />
            </SimpleGrid>
            <SimpleGrid mt={"xs"} cols={2}>
              <Select
                label="Brand"
                data={brands || []}
                placeholder="Brand"
                searchable
                {...form.getInputProps("brand")}
                onChange={(e) => {
                  form.setFieldValue("brand", e);
                  if (e === "other") {
                    setIsOtherBrand(true);
                  } else {
                    setIsOtherBrand(false);
                  }
                }}
                required
              />
              <TextInput
                label="Product Tags"
                placeholder="Please enter comma separated tags (Example: tags 1, tag 2)"
                required
                {...form.getInputProps("tags")}
              />
            </SimpleGrid>
            {isOtherBrand && (
              <SimpleGrid mt={"xs"} cols={2}>
                <TextInput
                  label="Brand Name"
                  placeholder="Please enter your product's brand name"
                  required
                  {...form.getInputProps("otherBrandName")}
                />
              </SimpleGrid>
            )}
            <SimpleGrid mt={"xs"} cols={3}>


             <NumberInput
                label="Selling Price"
                placeholder="120"
                required
                precision={2}
                min={0}
                value={form.values.price}
                onChange={(value) => handlePriceFieldChange('price',value)}
              />

              <NumberInput
                label="Discount Percentage"
                placeholder="0-100"
                required
                precision={2}
                min={0}
                max={100}
                value={form.values.discountPrice}
                onChange={(value) => handlePriceFieldChange('discountPrice', value)}
              />

              <NumberInput
                label="Cost Price"
                placeholder="100"
                required
                precision={2}
                min={0}
                value={form.values.vendorPrice}
                onChange={(value) => handlePriceFieldChange('vendorPrice', value)}
              />







              {/* <NumberInput
                label="Vendor Price"
                {...form.getInputProps("vendorPrice")}
                placeholder="100"
                required
              /> */}

               

 



              
              <NumberInput
                label="In Stock"
                placeholder="120"
                {...form.getInputProps("stockCountPending")}
              />
            </SimpleGrid>
            <FileInput
              label="Upload Images"
              placeholder="Upload Images"
              multiple
              {...form.getInputProps("files")}
              onChange={(files: any) => {
                if (files.length > 0) {
                  files.forEach(async (file: File) => {
                    const formData = new FormData();
                    formData.append("file", file);
                    await axiosConfig
                      .post(`image/upload`, formData)
                      .then((response: any) => {
                        let image = response.data.image;
                        if (image) {
                          let media: any = form.values?.media || [];
                          media.push({
                            imageURL: image.url,
                            imageId: image.fileId,
                            isFront: false,
                          });
                          form.setFieldValue("media", media);
                        }
                      });
                  });
                }
              }}
            />
            <Box
              component="div"
              sx={{
                display: "flex",
                justifyContent: "start",
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
              {form.values?.media?.length > 0 ? (
                form.values.media.map((img: any, i: number) => (
                  <Box
                    component="span"
                    sx={{
                      margin: 5,
                      position: "relative",
                      padding: 5,
                      border: img.isFront ? "2px solid green" : "none",
                    }}
                    onClick={() => {
                      let media: any = form.values.media || [];
                      media = media.map((m: any, m_i: number) => ({
                        ...m,
                        isFront: i === m_i,
                      }));
                      form.setFieldValue("media", media);
                    }}
                  >
                    <CircleX
                      style={{
                        position: "absolute",
                        top: "-8px",
                        right: "-8px",
                        zIndex: 100,
                        color: "red",
                      }}
                      onClick={() => {
                        let media: any = form.values.media || [];
                        media.splice(i, 1);
                        form.setFieldValue("media", media);
                      }}
                    />
                    <Image
                      key={i}
                      width={100}
                      height={100}
                      fit="cover"
                      src={img.imageURL}
                    />
                  </Box>
                ))
              ) : (
                <Image
                  width={200}
                  height={80}
                  fit="contain"
                  src={placeholder}
                />
              )}
            </Box>
          </Grid.Col>
          <Grid.Col md={2} lg={1}>
            <SimpleGrid mt={"xs"} cols={2}>
              <Select
                label="Subject"
                data={subjects || []}
                disabled={form.values.category !== "635d7aa623840ef068eb748f"}
                placeholder="Subject"
                {...form.getInputProps("subject")}
              />
              <NumberInput
                label="ISBN Number"
                placeholder="ISBN Number"
                disabled={form.values.category !== "635d7aa623840ef068eb748f"}
                {...form.getInputProps("isbn")}
                hideControls
              />
              <NumberInput
                defaultValue={18}
                placeholder="Your age"
                label="Age target"
                withAsterisk
                min={1}
                description={"Age should be min 1 "}
                stepHoldDelay={500}
                stepHoldInterval={100}
                {...form.getInputProps("targetAge")}
                hideControls
              />
            </SimpleGrid>
            <SimpleGrid mt={"xs"} cols={3}>
              <Checkbox
                label="is Available"
                {...form.getInputProps("available", { type: "checkbox" })}
              />
              {
                // {user.role !== "Admin" ? () :
                user.role == "Admin" && (
                  <>
                    <Checkbox
                      label="is Active"
                      {...form.getInputProps("isActive", { type: "checkbox" })}
                    />
                    <Checkbox
                      label="is Featured"
                      {...form.getInputProps("isFeatured", {
                        type: "checkbox",
                      })}
                    />
                  </>
                )
              }
            </SimpleGrid>
            {form.values.category !== "635d7aa623840ef068eb748f" && (
              <SimpleGrid mt={"xs"} cols={1}>
                <Accordion defaultValue="customization">
                  {(Object.values(options) || []).map(
                    (option: any, i: number) => (
                      <Accordion.Item key={i} value={option.value}>
                        <Accordion.Control sx={{ textTransform: "capitalize" }}>
                          {option.value}
                        </Accordion.Control>
                        <Accordion.Panel>
                          <Box
                            component="span"
                            sx={{ display: "flex", alignItems: "end" }}
                          >
                            <TextInput
                              sx={{ flex: 1 }}
                              label="Value"
                              placeholder="Value"
                              value={option.lastValue}
                              onChange={(e) => {
                                setOptions((prev: any) => ({
                                  ...prev,
                                  [option.value]: {
                                    ...prev[option.value],
                                    lastValue: e.target.value,
                                  },
                                }));
                              }}
                            />
                            <ActionIcon
                              disabled={!option.lastValue}
                              variant="filled"
                              onClick={() => {
                                setOptions((prev: any) => ({
                                  ...prev,
                                  [option.value]: {
                                    ...prev[option.value],
                                    values: [
                                      ...option.values,
                                      option.lastValue,
                                    ],
                                    lastValue: "",
                                  },
                                }));
                              }}
                            >
                              <Plus size={16} />
                            </ActionIcon>
                          </Box>
                          {(option.values || []).map(
                            (value: string, vi: number) => (
                              <Box
                                component="span"
                                key={vi}
                                sx={{ display: "flex", alignItems: "end" }}
                              >
                                <TextInput
                                  sx={{ flex: 1 }}
                                  label="Value"
                                  placeholder="Value"
                                  value={value}
                                />
                                <ActionIcon variant="filled">
                                  <Minus
                                    size={16}
                                    onClick={() => {
                                      setOptions((prev: any) => ({
                                        ...prev,
                                        [option.value]: {
                                          ...prev[option.value],
                                          values: option.values.filter(
                                            (x: any) =>
                                              option.values.indexOf(x) != vi
                                          ),
                                          lastValue: "",
                                        },
                                      }));
                                    }}
                                  />
                                </ActionIcon>
                              </Box>
                            )
                          )}
                        </Accordion.Panel>
                      </Accordion.Item>
                    )
                  )}
                </Accordion>
              </SimpleGrid>
            )}

            <Text style={{ marginTop: "10px" }}>Description</Text>
            <Textarea
              placeholder="Description"
              minRows={5}
              {...form.getInputProps("description")}
            />
          </Grid.Col>
        </Grid>

        <Button loading={submitting} type="submit" my={"sm"} mx={"sm"}>
          Save
        </Button>
        <Button
          loading={submitting}
          onClick={() => setIsAddModalOpened(false)}
          type="button"
          my={"sm"}
        >
          Back
        </Button>
      </form>
    </Modal>
  );
}

export default ProductModal;
