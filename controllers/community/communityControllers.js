const { sendQuery } = require('../../config/database'); 

const getAllPosts = async (req,res)=>{
  const posts = await sendQuery(
    `
    select post_id, user_id, category_id, title, view_cnt, parent_post_id, path, depth, created_time, updated_time 
    from post
    where is_deleted = false
    `
  );
  res.json(posts);
}

const getPosts = async (req,res)=>{
  const {board_id} = req.params;
  if (!board_id){
    const posts = await sendQuery(
      `
      select post_id, user_id, category_id, title, view_cnt, parent_post_id, path, depth, created_time, updated_time 
      from post
      where is_deleted = false
      `
    );
    console.log("all",posts);
    res.json(posts);

    return;
  }
  const posts = await sendQuery(
    `
    select post_id, user_id, category_id, title, view_cnt, parent_post_id, path, depth, created_time, updated_time 
    from post
    where is_deleted = false and category_id = $1
    `,[board_id]
  );
  console.log(posts);
  res.json(posts);
}

const getPost = async (req,res)=>{
  const {postId} = req.params;
  const posts = await sendQuery(
    `
    select * 
    from post
    where post_id = $1
    `,
    [postId]
  );
  
  if ((!posts)||posts.length == 0){
    res.status(404).json({msg:"게시물을 찾을수 없습니다."})
    return;
  }

  res.status(200).json(posts[0]);
}

const createPost = async (req,res)=>{
  if (req.isAuthenticated() == false){
    return res.json({msg:"회원이 아닙니다."});
  }
  const form = req.body;
  const {user} = req;
  const {board_id, title, content} = form;
  const {userId} = user;
  const path = "/";
  const depth = 1;
  console.log(content)
  await sendQuery("insert into post(user_id, category_id, title, content, path, depth, is_deleted) values($1, $2, $3, $4, $5, $6, $7)",
    [userId, board_id, title, content, path, depth,false]);
  console.log(user);
  console.log(form);
  // console.log(posts);
  res.json({msg:"test"});
}

const deletePost = async (req,res)=>{
  if (req.isAuthenticated() == false){
    return res.json({msg:"회원이 아닙니다."});
  }
  const {userId:authId} = req.user;
  const {userId:reqId, postId} = req.body;
  // console.log(req.body);
  if(authId !== reqId){
    res.json({msg:"권한이 없습니다1.", success:false});
    return;
  }
  const target = await sendQuery(`select user_id from post where post_id = $1`,[postId]);
  if(target.length ===0)
    return res.json({msg:"존재하지 않는 게시글 입니다.", success:false});
  const dbUser = target[0].userId;
  // console.log(target);
  // console.log(authId, reqId, dbUser)
  if(authId !== dbUser){
    res.json({msg:"권한이 없습니다2.", success:false});
    return;
  }
  await sendQuery(`update post set is_deleted = $1 where post_id = $2`,[true,postId]);
  res.json({msg:"삭제가 완료되었습니다.", success:true});
}

module.exports = {getPosts,getPost,createPost,deletePost};