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

    if (values.vendorPrice > values.price) {
      return showNotification({
        autoClose: 5000,
        // title: "",
        message: "Vendor price should be higher than selling price   ",
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
                label="Vendor Price"
                {...form.getInputProps("vendorPrice")}
                placeholder="100"
                required
              />
              <NumberInput
                label="Selling Price"
                placeholder="120"
                required
                {...form.getInputProps("price")}
              />
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
