import { ID, Models, Query } from "appwrite"
import { INewPost, INewUser, IUpdatePost, IUpdateUser } from "@/types"
import { appwriteConfig, account, databases, avatars, storage } from "./config"

// Auth

export async function createUserAccount(user: INewUser) {
  try {
    const newAccount = await account.create(
      ID.unique(),
      user.email,
      user.password,
      user.name
    )

    if (!newAccount) throw Error

    const avatarUrl = avatars.getInitials(user.name)

    const newUser = await saveUserToDB({
      accountId: newAccount.$id,
      name: newAccount.name,
      email: newAccount.email,
      username: user.username,
      imageUrl: avatarUrl
    })

    return newUser
  } catch (error) {
    console.log(error)
    return error
  }
}

export async function saveUserToDB(user: {
  accountId: string
  email: string
  name: string
  imageUrl: URL
  username?: string
}) {
  try {
    const newUser = await databases.createDocument(
      appwriteConfig.databaseId,
      appwriteConfig.userCollectionId,
      ID.unique(),
      user
    )

    return newUser
  } catch (error) {
    console.log(error)
  }
}

export async function signInAccount(user: { email: string; password: string }) {
  try {
    const session = await account.createEmailSession(user.email, user.password)

    return session
  } catch (error) {
    console.log(error)
  }
}

export async function signOutAccount() {
  try {
    const session = await account.deleteSession("current")

    return session
  } catch (error) {
    console.log(error)
  }
}

// Post

export async function createPost(post: INewPost) {
  try {
    // Upload image to storage
    const uploadedFile = await uploadFile(post.file[0])

    if (!uploadedFile) throw Error

    // Get file url
    const fileUrl = getFilePreview(uploadedFile.$id)

    if (!fileUrl) {
      deleteFile(uploadedFile.$id)
      throw Error
    }

    // Concert tags into an array
    const tags = post.tags?.replace(/ /g, "").split(",") || []

    // Save post to database
    const newPost = await databases.createDocument(
      appwriteConfig.databaseId,
      appwriteConfig.postCollectionId,
      ID.unique(),
      {
        creator: post.userId,
        caption: post.caption,
        imageUrl: fileUrl,
        imageId: uploadedFile.$id,
        location: post.location,
        tags: tags
      }
    )

    if (!newPost) {
      await deleteFile(uploadedFile.$id)
      throw Error
    }

    return newPost
  } catch (error) {
    console.log(error)
  }
}

export async function getFollowingPosts() {
  try {
    const currentUser = await getCurrentUser()

    if (!currentUser) throw Error

    const userIds = currentUser?.following.map(
      (creator: Models.Document) => creator.followedUser.$id
    )

    userIds.push(currentUser.$id)

    const fetchPosts = await Promise.all(
      userIds.map((userId: string) =>
        databases.listDocuments(
          appwriteConfig.databaseId,
          appwriteConfig.postCollectionId,
          [Query.equal("creator", userId)]
        )
      )
    )

    const postList = fetchPosts
      .flatMap((creator) => creator.documents)
      .sort(
        (a, b) =>
          new Date(b.$createdAt).getTime() - new Date(a.$createdAt).getTime()
      )

    if (!postList) throw Error

    return postList
  } catch (error) {
    console.log(error)
  }
}

export async function getHomeFeedPosts(page: number, pageSize: number = 3) {
  try {
    const allPosts = await getFollowingPosts()
    const startIndex = (page - 1) * pageSize
    const endIndex = startIndex + pageSize
    const slicedPosts = allPosts?.slice(startIndex, endIndex)

    return slicedPosts
  } catch (error) {
    console.log(error)
  }
}

export async function getAllPosts() {
  try {
    const posts = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.postCollectionId,
      [Query.orderDesc("$updatedAt")]
    )

    if (!posts) throw Error

    return posts.documents
  } catch (error) {
    console.log(error)
  }
}

export async function getExplorePosts(page: number, pageSize: number = 9) {
  try {
    const allPosts = await getAllPosts()
    const startIndex = (page - 1) * pageSize
    const endIndex = startIndex + pageSize
    const slicedPosts = allPosts?.slice(startIndex, endIndex)

    return slicedPosts
  } catch (error) {
    console.log(error)
  }
}

export async function searchPosts(searchTerm: string) {
  try {
    const posts = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.postCollectionId,
      [Query.search("caption", searchTerm)]
    )

    if (!posts) throw Error

    return posts
  } catch (error) {
    console.log(error)
  }
}

export async function getPostById(postId?: string) {
  if (!postId) throw Error

  try {
    const post = await databases.getDocument(
      appwriteConfig.databaseId,
      appwriteConfig.postCollectionId,
      postId
    )

    if (!post) throw Error

    return post
  } catch (error) {
    console.log(error)
  }
}

export async function getUserPosts(userId?: string) {
  if (!userId) return

  try {
    const userPosts = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.postCollectionId,
      [Query.equal("creator", userId), Query.orderDesc("$createdAt")]
    )

    if (!userPosts) throw Error

    return userPosts
  } catch (error) {
    console.log(error)
  }
}

export async function getUserProfilePosts(
  userId: string,
  page: number,
  pageSize: number = 6
) {
  try {
    const profileUser = await getUserPosts(userId)
    const allPosts = profileUser?.documents
    const startIndex = (page - 1) * pageSize
    const endIndex = startIndex + pageSize
    const slicedPosts = allPosts?.slice(startIndex, endIndex)

    return slicedPosts
  } catch (error) {
    console.log(error)
  }
}

export async function likePost(postId: string, likesArray: string[]) {
  try {
    const updatedPost = await databases.updateDocument(
      appwriteConfig.databaseId,
      appwriteConfig.postCollectionId,
      postId,
      { likes: likesArray }
    )

    if (!updatedPost) throw Error

    return updatedPost
  } catch (error) {
    console.log(error)
  }
}

export async function savePost(postId: string, userId: string) {
  try {
    const updatedPost = await databases.createDocument(
      appwriteConfig.databaseId,
      appwriteConfig.savesCollectionId,
      ID.unique(),
      { user: userId, post: postId }
    )

    if (!updatedPost) throw Error

    return updatedPost
  } catch (error) {
    console.log(error)
  }
}

export async function deleteSavedPost(savedRecordId: string) {
  try {
    const statusCode = await databases.deleteDocument(
      appwriteConfig.databaseId,
      appwriteConfig.savesCollectionId,
      savedRecordId
    )

    if (!statusCode) throw Error

    return { status: "ok" }
  } catch (error) {
    console.log(error)
  }
}

export async function updatePost(post: IUpdatePost) {
  const hasFileToUpdate = post.file.length > 0

  try {
    let image = {
      imageUrl: post.imageUrl,
      imageId: post.imageId
    }

    if (hasFileToUpdate) {
      // Upload image to storage
      const uploadedFile = await uploadFile(post.file[0])

      if (!uploadedFile) throw Error

      // Get file url
      const fileUrl = getFilePreview(uploadedFile.$id)

      if (!fileUrl) {
        deleteFile(uploadedFile.$id)
        throw Error
      }

      image = {
        ...image,
        imageUrl: fileUrl,
        imageId: uploadedFile.$id
      }
    }

    // Concert tags into an array
    const tags = post.tags?.replace(/ /g, "").split(",") || []

    // Save post to database
    const updatedPost = await databases.updateDocument(
      appwriteConfig.databaseId,
      appwriteConfig.postCollectionId,
      post.postId,
      {
        caption: post.caption,
        imageUrl: image.imageUrl,
        imageId: image.imageId,
        location: post.location,
        tags: tags
      }
    )

    if (!updatedPost) {
      await deleteFile(post.imageId)
      throw Error
    }

    return updatedPost
  } catch (error) {
    console.log(error)
  }
}

export async function deletePost(postId: string, imageId: string) {
  if (!postId || !imageId) throw Error

  try {
    await databases.deleteDocument(
      appwriteConfig.databaseId,
      appwriteConfig.postCollectionId,
      postId
    )

    return { status: "ok" }
  } catch (error) {
    console.log(error)
  }
}

// File

export async function uploadFile(file: File) {
  try {
    const uploadedFile = await storage.createFile(
      appwriteConfig.storageId,
      ID.unique(),
      file
    )

    return uploadedFile
  } catch (error) {
    console.log(error)
  }
}

export function getFilePreview(fileId: string) {
  try {
    const fileUrl = storage.getFilePreview(
      appwriteConfig.storageId,
      fileId,
      2000,
      2000,
      "top",
      100
    )

    return fileUrl
  } catch (error) {
    console.log(error)
  }
}

export async function deleteFile(fileId: string) {
  try {
    await storage.deleteFile(appwriteConfig.storageId, fileId)

    return { status: "ok" }
  } catch (error) {
    console.log(error)
  }
}

// User

export async function getCurrentUser() {
  try {
    const currentAccount = await account.get()

    if (!currentAccount) throw Error

    const currentUser = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.userCollectionId,
      [Query.equal("accountId", currentAccount.$id)]
    )

    if (!currentUser) throw Error

    return currentUser.documents[0]
  } catch (error) {
    console.log(error)
  }
}

export async function getUserById(userId?: string) {
  if (!userId) return

  try {
    const user = await databases.getDocument(
      appwriteConfig.databaseId,
      appwriteConfig.userCollectionId,
      userId
    )

    if (!user) return

    return user
  } catch (error) {
    console.log(error)
  }
}

export async function getUsers(limit?: number) {
  const queries: any[] = []

  if (limit) {
    queries.push(Query.limit(limit))
  }
  try {
    const allUsers = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.userCollectionId,
      queries
    )

    if (!allUsers) throw Error

    return allUsers.documents.sort(
      (a, b) => b.followers.length - a.followers.length
    )
  } catch (error) {
    console.log(error)
  }
}

export async function getAllUsers(page: number, pageSize: number = 9) {
  try {
    const allUsers = await getUsers()
    const startIndex = (page - 1) * pageSize
    const endIndex = startIndex + pageSize
    const slicedUsers = allUsers?.slice(startIndex, endIndex)

    return slicedUsers
  } catch (error) {
    console.log(error)
  }
}

export async function updateUser(user: IUpdateUser) {
  const hasFileToUpdate = user.file.length > 0

  try {
    let image = {
      imageUrl: user.imageUrl,
      imageId: user.imageId
    }

    if (hasFileToUpdate) {
      // Upload new file to appwrite storage
      const uploadedFile = await uploadFile(user.file[0])
      if (!uploadedFile) throw Error

      // Get new file url
      const fileUrl = getFilePreview(uploadedFile.$id)
      if (!fileUrl) {
        await deleteFile(uploadedFile.$id)
        throw Error
      }
      image = { ...image, imageUrl: fileUrl, imageId: uploadedFile.$id }
    }

    // Update user
    const updatedUser = await databases.updateDocument(
      appwriteConfig.databaseId,
      appwriteConfig.userCollectionId,
      user.userId,
      {
        name: user.name,
        username: user.username,
        email: user.email,
        bio: user.bio,
        imageUrl: image.imageUrl,
        imageId: image.imageId
      }
    )

    // Update account
    const updatedAccount = await account.updateName(user.name)

    // Failed to update
    if (!updatedUser || !updatedAccount) {
      // Delete new file that has been recently uploaded
      if (hasFileToUpdate) {
        await deleteFile(image.imageId)
      }
      throw Error
    }

    // Delete old file after successful updates
    if (user.imageId && hasFileToUpdate) {
      await deleteFile(user.imageId)
    }
  } catch (error) {
    console.log(error)
  }
}

export async function followUser(userId: string, followedUserId: string) {
  try {
    const followedUser = await databases.createDocument(
      appwriteConfig.databaseId,
      appwriteConfig.followersCollectionId,
      ID.unique(),
      { follower: userId, followedUser: followedUserId }
    )

    if (!followedUser) throw Error

    return followedUser
  } catch (error) {
    console.log(error)
  }
}

export async function unfollowUser(followedUserRecord: string) {
  try {
    const statusCode = await databases.deleteDocument(
      appwriteConfig.databaseId,
      appwriteConfig.followersCollectionId,
      followedUserRecord
    )

    if (!statusCode) throw Error

    return { status: "ok" }
  } catch (error) {
    console.log(error)
  }
}
