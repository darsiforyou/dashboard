import { Box, Button, Group, TextInput, Title } from "@mantine/core";
import { DataTable } from "mantine-datatable";
import React from "react";

export function OrderList() {
  return (
    <Box>
      <Title>Orders list</Title>
      <Group my="xl" position="apart">
        <TextInput placeholder="Search" />
        <Button>Filters</Button>
      </Group>
      <Box sx={{ maxheight: "80vh" }}>
        <DataTable
          // withColumnBorders
          // striped
          // highlightOnHover
          minHeight={"150px"}
          // page={orders?.data?.page}
          // onPageChange={onPagination}
          // totalRecords={orders?.data?.totalDocs}
          // recordsPerPage={filters.limit}
          // idAccessor="_id"
          // fontSize="sm"
          // records={orders?.data?.docs}
          // fetching={isLoading}

          columns={[]}
        />
      </Box>
    </Box>
  );
}
