import { useEffect, useState } from "react";

import { Box } from "@mui/material";

import EmptyNote from "@/components/EmptyNote";
import NoteSkeleton from "@/components/NoteSkeleton";
import { NoteCard } from "@/components/main";
import SideDrawer from "@/components/main/SideDrawer";
import { useAuth } from "@/context/AuthContext";
import { axiosInstance, destroyInterceptor, getInterceptor } from "@/lib/axios";
import { Note } from "@/types/notes";
import { Masonry } from "@mui/lab";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";

async function fetchGeneralNotes(
  uid: string | null | undefined,
  token: string | null,
) {
  if (!uid || !token) {
    return Promise.reject("Invalid token");
  }
  const searchParams = new URLSearchParams();
  searchParams.set("user", uid);
  searchParams.set("field", "category");
  searchParams.set("q", "general");

  getInterceptor(token);
  const res = await axiosInstance
    .get(`/notes?${searchParams.toString()}`)
    .finally(() => {
      destroyInterceptor();
    });
  return res.data;
}

function General() {
  const { user, token } = useAuth();
  const { data, isLoading } = useQuery<Note[]>({
    queryKey: ["notes", "general", user?.uid, token],
    queryFn: () => fetchGeneralNotes(user?.uid, token),
    enabled: !!user,
  });
  const [searchedNotes, setSearchedNotes] = useState<Note[]>([]);
  const [searchParams] = useSearchParams();

  const searchString = searchParams.get("q");

  useEffect(() => {
    const query = searchParams.get("q");

    if (!query || !data) {
      return;
    }

    setSearchedNotes(
      data.filter((item) => {
        if (item.text.toLocaleLowerCase().includes(query.toLocaleLowerCase())) {
          return item;
        }
      }),
    );
  }, [searchParams, data]);

  return (
    <Box
      sx={{
        width: "100%",
        overflow: "auto",
        paddingBottom: "15px",
      }}
    >
      <SideDrawer />
      <Box sx={{ width: "100%" }} pt={3}>
        {isLoading ? (
          <NoteSkeleton />
        ) : !data ||
          data.length <= 0 ||
          (searchedNotes.length <= 0 && searchString) ? (
          <EmptyNote />
        ) : (
          <Box display={"flex"} justifyContent={"center"} alignItems={"center"}>
            <Masonry columns={{ xs: 1, sm: 2, md: 3 }} spacing={2}>
              {(searchedNotes.length > 0 && searchParams.get("q")
                ? searchedNotes
                : data
              ).map((note) => {
                return (
                  <NoteCard
                    key={note.id}
                    id={note.id}
                    text={note.text}
                    isComplete={note.isComplete}
                    category={note.category}
                    timestamp={note.timestamp}
                    sharedWith={note.sharedWith}
                    userId={note.userId}
                    isShared={false}
                    updatedAt={note.updatedAt}
                  />
                );
              })}
            </Masonry>
          </Box>
        )}
      </Box>
    </Box>
  );
}

export default General;
