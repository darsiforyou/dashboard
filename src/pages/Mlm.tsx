import React, { FormEvent, useEffect, useState } from "react";
import {
  Box,
  Button,
  Group,
  Paper,
  SimpleGrid,
  Text,
  TextInput,
  ThemeIcon,
} from "@mantine/core";
import { Category2 } from "tabler-icons-react";
import { z } from "zod";
import axiosConfig from "../configs/axios";
import { getFormData } from "../utils/getFormData";
import { Mlm } from "../utils/API_CONSTANT";
import { useForm, zodResolver } from "@mantine/form";

interface MlmData {
  data: any;
  levelOne: number;
  levelTwo: number;
  levelThree: number;
  createdAt: string;
}



export const MLM = () => {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [mlmdata, setMlmData] = useState<MlmData>({
    data:0,
    levelOne: 0,
    levelTwo: 0,
    levelThree: 0,
    createdAt: "",
  });

  
  const schema = z.object({
    _id: z.string(),
    levelOne: z.number(),
    levelTwo: z.number(),
    levelThree: z.number(),
  });

  useEffect(() => {
    async function handleData() {
      const options = {
        headers: {
          "Content-Type": "application/json",
        },
      };

      try {
        const response = await axiosConfig.get<MlmData>(Mlm, options);
        if (response.data) {
          const apiData = response.data.data[0];
          setMlmData(apiData);
        }
      } catch (error) {
        console.error("API Error:", error);
      }
      setLoading(false); // Set loading to false once the data is available or an error occurs
    }

    handleData();
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const values = form.values;
    setSubmitting(true);
    const formData = getFormData(values);
    const options = {
      headers: {
        "Content-Type": "application/json",
      },
    };

    try {
      const res = await axiosConfig.post(
        Mlm + "/update/" + "6432891e68a79f743163edea",
        formData,
        options
      );
      if (res?.status === 200) {
        setSubmitting(false);
        // form.reset();
      }
    } catch (error) {
      console.error("API Error:", error);
    }
  };
// const form = useForm<MlmData>({
//   validate: zodResolver(schema),
//   initialValues: {
//     levelOne: mlmdata.levelOne,
//     levelTwo: mlmdata.levelTwo,
//     levelThree: mlmdata.levelThree,
//     createdAt: mlmdata.createdAt || "",
//   },
// });
useEffect(() => {
  form.setValues(mlmdata);
}, [mlmdata]);

const form = useForm<MlmData>({
  validate: zodResolver(schema),
  initialValues: mlmdata,
});

  // useEffect(() => {
  //   form.reset({
  //     levelOne: mlmdata.levelOne,
  //     levelTwo: mlmdata.levelTwo,
  //     levelThree: mlmdata.levelThree,
  //   });
  // }, []);



  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <Box sx={{ width: "600px", margin: "30px 0" }}>
        <SimpleGrid
          cols={3}
          breakpoints={[
            { minWidth: 300, cols: 1 },
            { minWidth: 1000, cols: 1 },
          ]}
        >
          <form onSubmit={handleSubmit}>
            <Paper
              shadow="xs"
              p="sm"
              sx={(theme) => ({
                borderLeft: `4px solid ${theme.colors.blue[5]}`,
              })}
            >
              <Group
                style={{
                  margin: "16px",
                }}
              >
                <ThemeIcon>
                  <Category2 size={16} />
                </ThemeIcon>
                <Text>First Level Percentage</Text>
              </Group>
              <TextInput
                placeholder="Enter First Level Percentage"
                required
                {...form.getInputProps("levelOne")}
              />

              <Group
                style={{
                  margin: "16px",
                }}
              >
                <ThemeIcon>
                  <Category2 size={16} />
                </ThemeIcon>
                <Text>Second Level Percentage</Text>
              </Group>
              <TextInput
                placeholder="Enter Second Level Percentage"
                required
                {...form.getInputProps("levelTwo")}
              />
              <Group
                style={{
                  margin: "16px",
                }}
              >
                <ThemeIcon>
                  <Category2 size={16} />
                </ThemeIcon>
                <Text>Third Level Percentage</Text>
              </Group>
              <TextInput
                placeholder="Enter Third Level Percentage"
                required
                {...form.getInputProps("levelThree")}
              />
              <Button
                style={{
                  margin: "16px",
                }}
                type="submit"
                loading={submitting}
              >
                Submit
              </Button>
            </Paper>
          </form>
        </SimpleGrid>
      </Box>
    </>
  );
};

