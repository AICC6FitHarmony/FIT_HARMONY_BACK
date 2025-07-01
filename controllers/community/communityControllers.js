const { sendQuery } = require('../../config/database'); 

const getAllPosts = async (req,res)=>{
  try {
    const posts = await sendQuery(
      `
      select post_id, user_id, category_id, title, view_cnt, parent_post_id, path, depth, created_time, updated_time 
      from post
      where is_deleted = false
      `
    );
    res.json(posts);
  } catch (error) {
    res.json({msg:error, success:false})
  }
}

const getPosts = async (req,res)=>{
  const {board_id} = req.params;
  if (!board_id){
    try {
      const posts = await sendQuery(
        `
        select post_id, user_id, nick_name, category_id, title, view_cnt, parent_post_id, path, depth, created_time, updated_time 
        from post
        left join (select nick_name,user_name, user_id as usr_id from "USER") as usr
        on usr.usr_id = post.user_id
        where is_deleted = FALSE;
        `
      );
      console.log("all",posts);
      res.json(posts);
    } catch (error) {
      res.json({msg:error, success:false})
    }
    return;
  }

  try {
    const posts = await sendQuery(
      `
      select post_id, user_id, category_id, title, view_cnt, parent_post_id, path, depth, created_time, updated_time 
      from post
      where is_deleted = false and category_id = $1
      `,[board_id]
    );
    console.log(posts);
    res.json(posts);
  } catch (error) {
    res.json({msg:error, success:false});
  }
}

const getPost = async (req,res)=>{
  const {postId} = req.params;
  try {
    const posts= await sendQuery(
      `
      UPDATE post
      SET view_cnt = view_cnt + 1
      FROM "USER" u
      WHERE post.post_id = $1
        AND post.user_id = u.user_id
      RETURNING 
        post.*,
        u.nick_name;
      `,[postId]
    )
    if ((!posts)||posts.length == 0){
      res.status(404).json({msg:"게시물을 찾을수 없습니다.", success:false})
      return;
    }
    const result = {
      ...posts[0], success:true
    }
  
    res.status(200).json(result);
  } catch (error) {
    res.json({msg:error, success:false})
  }
  
}

const createPost = async (req,res)=>{
  if (req.isAuthenticated() == false){
    return res.json({msg:"회원이 아닙니다.", success : false});
  }
  try {
    const form = req.body;
    const {user} = req;
    const {board_id, title, content} = form;
    const {userId} = user;
    const path = "/";
    const depth = 1;
    // console.log(content)
    posts = await sendQuery("insert into post(user_id, category_id, title, content, path, depth, is_deleted) values($1, $2, $3, $4, $5, $6, $7) returning post_id",
      [userId, board_id, title, content, path, depth,false]);
    // console.log(posts);

    res.json({msg:"작성이 완료되었습니다.", postId : posts[0].postId, success: true});
  } catch (error) {
    res.json({msg:"작성이 실패", success: false});
  }
  
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
    res.json({msg:"권한이 없습니다.", success:false});
    return;
  }
  await sendQuery(`update post set is_deleted = $1 where post_id = $2`,[true,postId]);
  res.json({msg:"삭제가 완료되었습니다.", success:true});
}

const getComments = async (req, res)=>{
  const {postId} = req.params;
  try {
    const comments = await sendQuery(
      `
      select comment_id, post_id, nick_name, user_id, content, is_deleted, parent_comment_id, path, depth, created_time, updated_time 
      from comment c
      left join (select nick_name, user_id as usr_id from "USER") as usr
      on c.user_id = usr.usr_id
      where post_id = $1 
        and (is_deleted = false OR 
            EXISTS (
            SELECT 1
            FROM comment child
            WHERE child.parent_comment_id = c.comment_id and child.is_deleted = false
        ))
      order by path
      `,[postId]
    );
    res.json(comments);
  } catch (error) {
    res.json({msg:error, success:false});
  }
}

const deleteComment = async (req,res) => {
  if (req.isAuthenticated() == false){
    return res.json({msg:"회원이 아닙니다."});
  }
  const {userId:authId} = req.user;
  const {userId:reqId, commentId} = req.body;
  // console.log(req.body);
  if(authId !== reqId){
    res.json({msg:"권한이 없습니다1.", success:false});
    return;
  }

  const target = await sendQuery(`select user_id from comment where comment_id = $1`,[commentId]);
  if(target.length ===0)
    return res.json({msg:"존재하지 않는 댓글 입니다.", success:false});
  const dbUser = target[0].userId;
  // console.log(target);
  // console.log(authId, reqId, dbUser)
  if(authId !== dbUser){
    res.json({msg:"권한이 없습니다.", success:false});
    return;
  }
  await sendQuery(`update comment set is_deleted = $1 where comment_id = $2`,[true,commentId]);
  res.json({msg:"삭제가 완료되었습니다.", success:true});
}

const createComment = async (req,res)=>{
  if (req.isAuthenticated() == false){
    return res.json({msg:"회원이 아닙니다.", success : false});
  }
  try {
    const form = req.body;
    const {user} = req;
    const {post_id, content,parent_comment_id} = form;
    const {userId} = user;
    console.log(content)
    const parentInfo = {
      path : "", depth:0, child_cnt:0
    }

    if(parent_comment_id){
      const parent_res = await sendQuery(`
        select path, depth from comment where comment_id = $1
        `,[parent_comment_id]);
      parentInfo.path = parent_res[0].path;
      parentInfo.depth = parent_res[0].depth;
  
      const child_res = await sendQuery(`
        select (count(*) + 1) as child_num from comment where parent_comment_id = $1
        `,[parent_comment_id]);
      
      parentInfo.child_cnt = child_res[0].childNum;
    }else{
      const child_res = await sendQuery(`
        select (count(*) + 1) as child_num from comment where post_id = $1 and parent_comment_id is null
        `,[post_id]);
      parentInfo.child_cnt = child_res[0].childNum;
    }
    console.log(parentInfo);
    const path = `${parentInfo.path} ${parentInfo.child_cnt.toString().padStart(4,'0')}`.trim();
    const depth = parentInfo.depth +1;
    
    console.log(path,depth);

    await sendQuery("insert into comment(user_id, post_id, content,parent_comment_id, path, depth, is_deleted) values($1, $2, $3, $4, $5, $6, $7)",
      [userId, post_id, content,parent_comment_id, path, depth,false]);
    // console.log(posts);

    res.json({msg:"작성이 완료되었습니다.", success: true});
  } catch (error) {
    console.log(error)
    res.json({msg:"작성이 실패", success: false});
  }
  
}

const updateComment = async (req, res)=>{
  if (req.isAuthenticated() == false){
    return res.json({msg:"회원이 아닙니다.", success : false});
  }
  const {userId:authId} = req.user;
  const {userId:reqId, commentId, content} = req.body;
  // console.log(req.body);
  if(authId !== reqId){
    res.json({msg:"권한이 없습니다1.", success:false});
    return;
  }
  const target = await sendQuery(`select user_id from comment where comment_id = $1`,[commentId]);
  if(target.length ===0)
    return res.json({msg:"존재하지 않는 댓글 입니다.", success:false});
  const dbUser = target[0].userId;
  // console.log(target);
  // console.log(authId, reqId, dbUser)
  if(authId !== dbUser){
    res.json({msg:"권한이 없습니다.", success:false});
    return;
  }

  await sendQuery(`
    update comment set content = $1 where comment_id = $2
    `,[content, commentId])
  res.json({msg:"수정이 완료되었습니다.", success:true});
}

module.exports = {getPosts,getPost,createPost,deletePost, getComments, createComment, deleteComment, updateComment};