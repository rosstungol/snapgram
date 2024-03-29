import {
  useQuery,
  useMutation,
  useQueryClient,
  useInfiniteQuery
} from "@tanstack/react-query"
import {
  createPost,
  createUserAccount,
  deletePost,
  deleteSavedPost,
  followUser,
  getAllUsers,
  getCurrentUser,
  getExplorePosts,
  getHomeFeedPosts,
  getPostById,
  getUserById,
  getUserPosts,
  getUserProfilePosts,
  getUsers,
  likePost,
  savePost,
  searchPosts,
  signInAccount,
  signOutAccount,
  unfollowUser,
  updatePost,
  updateUser
} from "../appwrite/api"
import { INewPost, INewUser, IUpdatePost, IUpdateUser } from "@/types"
import { QUERY_KEYS } from "./queryKeys"

// Auth

export const useCreateUserAccount = () => {
  return useMutation({
    mutationFn: (user: INewUser) => createUserAccount(user)
  })
}

export const useSignInAccount = () => {
  return useMutation({
    mutationFn: (user: { email: string; password: string }) =>
      signInAccount(user)
  })
}

export const useSignOutAccount = () => {
  return useMutation({
    mutationFn: signOutAccount
  })
}

// Post

export const useCreatePost = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (post: INewPost) => createPost(post),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_HOME_FEED_POSTS]
      })
    }
  })
}

export const useGetHomeFeedPosts = () => {
  return useInfiniteQuery({
    queryKey: [QUERY_KEYS.GET_HOME_FEED_POSTS],
    queryFn: ({ pageParam }) => getHomeFeedPosts(pageParam),
    getNextPageParam: (_, pages) => pages.length + 1,
    initialPageParam: 1
  })
}

export const useGetExplorePosts = () => {
  return useInfiniteQuery({
    queryKey: [QUERY_KEYS.GET_EXPLORE_POSTS],
    queryFn: ({ pageParam }) => getExplorePosts(pageParam),
    getNextPageParam: (_, pages) => pages.length + 1,
    initialPageParam: 1
  })
}

export const useSearchPosts = (searchTerm: string) => {
  return useQuery({
    queryKey: [QUERY_KEYS.SEARCH_POSTS, searchTerm],
    queryFn: () => searchPosts(searchTerm),
    enabled: !!searchTerm
  })
}

export const useGetPostById = (postId?: string) => {
  return useQuery({
    queryKey: [QUERY_KEYS.GET_POST_BY_ID, postId],
    queryFn: () => getPostById(postId),
    enabled: !!postId
  })
}

export const useGetUserPosts = (userId?: string) => {
  return useQuery({
    queryKey: [QUERY_KEYS.GET_USER_POSTS, userId],
    queryFn: () => getUserPosts(userId),
    enabled: !!userId
  })
}

export const useGetUserProfilePosts = (userId: string) => {
  return useInfiniteQuery({
    queryKey: [QUERY_KEYS.GET_USER_PROFILE_POSTS],
    queryFn: ({ pageParam }) => getUserProfilePosts(userId, pageParam),
    getNextPageParam: (_, pages) => pages.length + 1,
    initialPageParam: 1
  })
}

export const useLikePost = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      postId,
      likesArray
    }: {
      postId: string
      likesArray: string[]
    }) => likePost(postId, likesArray),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_POST_BY_ID, data?.$id]
      })
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_HOME_FEED_POSTS]
      })
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_CURRENT_USER]
      })
    }
  })
}

export const useSavePost = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ postId, userId }: { postId: string; userId: string }) =>
      savePost(postId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_HOME_FEED_POSTS]
      })
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_CURRENT_USER]
      })
    }
  })
}

export const useDeleteSavedPost = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (savedRecordId: string) => deleteSavedPost(savedRecordId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_HOME_FEED_POSTS]
      })
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_CURRENT_USER]
      })
    }
  })
}

export const useUpdatePost = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (post: IUpdatePost) => updatePost(post),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_POST_BY_ID, data?.$id]
      })
    }
  })
}

export const useDeletePost = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ postId, imageId }: { postId: string; imageId: string }) =>
      deletePost(postId, imageId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_HOME_FEED_POSTS]
      })
    }
  })
}

// User

export const useGetCurrentUser = () => {
  return useQuery({
    queryKey: [QUERY_KEYS.GET_CURRENT_USER],
    queryFn: getCurrentUser
  })
}

export const useGetUserById = (userId: string) => {
  return useQuery({
    queryKey: [QUERY_KEYS.GET_USER_BY_ID, userId],
    queryFn: () => getUserById(userId),
    enabled: !!userId
  })
}

export const useGetUsers = (limit?: number) => {
  return useQuery({
    queryKey: [QUERY_KEYS.GET_USERS],
    queryFn: () => getUsers(limit)
  })
}

export const useGetAllUsers = () => {
  return useInfiniteQuery({
    queryKey: [QUERY_KEYS.GET_ALL_USERS],
    queryFn: ({ pageParam }) => getAllUsers(pageParam),
    getNextPageParam: (_, pages) => pages.length + 1,
    initialPageParam: 1
  })
}

export const useUpdateUser = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (user: IUpdateUser) => updateUser(user),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_CURRENT_USER]
      })
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_USER_BY_ID, data?.$id]
      })
    }
  })
}

export const useFollowUser = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      userId,
      followedUserId
    }: {
      userId: string
      followedUserId: string
    }) => followUser(userId, followedUserId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_USER_FOLLOWING]
      })
    }
  })
}

export const useUnfollowUser = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (followedUserRecord: string) =>
      unfollowUser(followedUserRecord),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_USER_FOLLOWING]
      })
    }
  })
}
