const { sendQuery } = require('../../config/database'); 


const getPosts = async (req,res)=>{
  const posts = await sendQuery(
    `
    select post_id, user_id, category_id, title, view_cnt, parent_post_id, path, depth, created_time, updated_time 
    from post
    where is_deleted = false
    `
  );
  res.json(posts);
}

const getPost = async (req,res)=>{
  const {post_id} = req.params;
  const posts = await sendQuery(
    `
    select * 
    from post
    where post_id $1
    `,
    [post_id]
  );
  
  if ((!posts)||posts.length == 0){
    res.status(404).json({msg:"게시물을 찾을수 없습니다."})
    return;
  }

  res.status(200).json(posts[0]);
}

const createPost = async (req,res)=>{
  const posts = await sendQuery("select * from post");
  res.json(posts);
  console.log(posts);
}

module.exports = {getPosts,getPost,createPost};