import { Box, Group, Paper, Text, ThemeIcon } from "@mantine/core";
import { Column } from "primereact/column";
// import { DataTable } from "primereact/datatable";
import { DataTable } from "mantine-datatable";
import React, { useEffect, useState } from "react";
import { ShoppingCart } from "tabler-icons-react";
import { AxiosResponse } from "axios";
import axiosConfig from "../configs/axios";
import { DASHBOARD } from "../utils/API_CONSTANT";
import { useQuery } from "react-query";
import { Select } from "@mantine/core";
import { convertToMoney } from "../utils/convertToMoney";

function TopItems({ title, url, param }: any) {
  const [data, setData] = useState([]);
  const [limit, setLimit] = useState<string | null>("10");

  const fetchData = async () => {
    let URL = param
      ? `${DASHBOARD}${url}?limit=${limit}&vendor=${param}`
      : `${DASHBOARD}${url}?limit=${limit}`;
    const res: AxiosResponse = await axiosConfig.get(URL);

    const data = res.data;
    setData(data.data);
    return data.data;
  };
  useEffect(() => {
    fetchData();
  }, []);
  useEffect(() => {
    fetchData();
  }, [limit]);
  return (
    <Paper shadow="xs" p="sm">
      <Group>
        <ThemeIcon>
          <ShoppingCart size={16} />
        </ThemeIcon>
        <Text weight={500}>Top </Text>
        <Select
          placeholder="Select limit"
          data={[
            { value: "5", label: "5" },
            { value: "10", label: "10" },
            { value: "30", label: "30" },
            { value: "50", label: "50" },
            { value: "100", label: "100" },
          ]}
          value={limit}
          onChange={(val) => setLimit(val)}
          style={{ width: "70px" }}
          size={"xs"}
        />
        <Text size="sm" weight={500}>
          {title}
        </Text>
      </Group>
      <Group my={"sm"} styles={{ width: "100%" }}>
        {/* <DataTable
          style={{ width: "100%" }}
          scrollable
          scrollHeight="400px"
          value={data || []}
          responsiveLayout="scroll"
          size="small"
        >
          <Column
            header="ID"
            body={(row) => row._id.slice(0, 2)}
            style={{ minWidth: "40px" }}
          ></Column>
          <Column
            header="Name"
            body={(row) =>
              row.title ? row.title : row.firstname + " " + row.lastname
            }
            style={{ minWidth: "300px" }}
          ></Column>
          {
            title === "Products" && (
              <Column
                header="ISBN"
                field="isbn"
                style={{ minWidth: "100px" }}
              ></Column>
            )
          }
           {
            title === "Products" && (
              <Column
                header="QTY Sold"
                field="stockCountConsumed"
                style={{ minWidth: "100px" }}
              ></Column>
            )
          }
        </DataTable> */}
        <Box sx={{ width: "100%" }}>
          <DataTable
            withColumnBorders
            striped
            highlightOnHover
            style={{ width: "100%" }}
            minHeight={"150px"}
            fontSize="sm"
            records={data ?? []}
            idAccessor="_id"
            columns={[
              {
                accessor: "index",
                title: "#",
                width: 30,
                render: (record: any, index) => index + 1,
              },
              {
                accessor: "title",
                title: "Name",
                // width: 120,
                render: (record: any) =>
                  record.title
                    ? record.title
                    : record.name
                    ? record.name
                    : record.firstname + " " + record.lastname,
              },
              {
                accessor: "totalPurchase",
                title: "Purchase",
                width: 120,
                render: (record: any) => convertToMoney(record.totalPurchase),
                hidden: title !== "Customers",
              },
              {
                accessor: "totalPrice",
                title: "purchasing",
                width: 100,
                hidden: title !== "Products",
                render: (record: any) =>
                  convertToMoney(record?.price * record?.qty),
              },
              {
                accessor: "qty",
                title: "Qty",
                width: 60,
                hidden: title !== "Products",
                render: (record: any) => convertToMoney(record?.qty),
              },
              {
                accessor: "price",
                width: 60,
                hidden: title !== "Products",
                render: (record: any) => convertToMoney(record?.price),
              },
            ]}
          />
        </Box>
      </Group>
    </Paper>
  );
}

export default TopItems;
