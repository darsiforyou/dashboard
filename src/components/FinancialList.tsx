import { createStyles, Box, Text } from "@mantine/core";
import { useEffect, useState } from "react";
import { z } from "zod";
import axiosConfig from "../configs/axios";
import { FINANCIALS } from "../utils/API_CONSTANT";
import { AxiosResponse } from "axios";
import { useQuery } from "react-query";
import { DataTable } from "mantine-datatable";

import { format } from "fecha";

const schema = z.object({
  _id: z.string(),
  user: z.any(),
  order: z.any(),
  amount: z.number(),
  amountWithdraw: z.number(),
  status: z.string(),
});

const useStyles = createStyles((theme) => ({
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "start",
    width: "100%",
  },
}));

type Financial = z.infer<typeof schema>;

const fetchTableData = async ({ queryKey }: any) => {
  const [_, { page, limit, ...filters }] = queryKey;
  const params = new URLSearchParams(filters);
  const res: AxiosResponse = await axiosConfig.get(
    `${FINANCIALS}?page=${page}&limit=${limit}&${params}`
  );
  const data = res.data;
  return data;
};

interface Props {
  tabChange: boolean;
  paymentRequest: boolean;
}

export function FinancialList({ tabChange, paymentRequest }: Props) {
  const user = JSON.parse(sessionStorage.getItem("user") || "{}");
  const [filters, setfilters] = useState({
    limit: 10,
    page: 1,
    user: user.role === "Admin" ? "" : user._id,
    darsi: "",
    order: "",
  });

  const {
    isLoading,
    error,
    data: financials,
    refetch,
  } = useQuery(["financials", filters], fetchTableData, {
    enabled: true,
    refetchOnWindowFocus: true,
  });

  const { classes } = useStyles();
  const onPagination = async (event: any) => {
    await setfilters((prev: any) => ({
      ...prev,
      // limit: event.rows,
      page: event,
    }));
    await refetch();
  };

  useEffect(() => {
    refetch();
  }, [tabChange, paymentRequest]);

  return (
    <>
      <Box sx={{ height: "70vh" }}>
        <DataTable
          withBorder
          withColumnBorders
          striped
          highlightOnHover
          page={financials?.data?.page}
          onPageChange={onPagination}
          totalRecords={financials?.data?.totalDocs}
          recordsPerPage={filters.limit}
          idAccessor="_id"
          fontSize="sm"
          records={financials?.data?.docs}
          fetching={isLoading}
          columns={[
            {
              accessor: "index",
              title: "#",
              textAlignment: "right",
              width: 40,
              render: (record) => financials?.data?.docs.indexOf(record) + 1,
            },
            {
              accessor: "user",
              render: ({ user, darsi }: any) => (
                <>
                  {!darsi
                    ? user.length > 0
                      ? user[0].firstname + " " + user[0].lastname
                      : "Not Assign"
                    : "Darsi"}
                </>
              ),
            },
            {
              accessor: "type",
              title: "Type",
            },
            {
              accessor: "order_number",
              render: ({ order }: any) => <Text>{order[0]?.order_number}</Text>,
            },
            {
              accessor: "role",
              render: ({ user, darsi }: any) => (
                <>
                  {!darsi
                    ? user.length > 0
                      ? user[0].role
                      : "Not Assign"
                    : "Admin"}
                </>
              ),
            },
            {
              accessor: "amount",
            },
            {
              accessor: "createdAt",
              render: ({ createdAt }: any) => (
                <>{format(new Date(createdAt), "DD-MMM-YY")}</>
              ),
            },
          ]}
        />
      </Box>
    </>
  );
}
