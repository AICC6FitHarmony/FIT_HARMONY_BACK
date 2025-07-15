const { sendQuery } = require('../../config/database'); 


const getBoardInfo = async(req, res)=>{
  const {boardId} = req.params;
  const query = `select * from post_category where category_id = $1`;
  const values = [boardId];
  try {
    const result = await sendQuery(query,values);
    if(result.length === 0){
      res?.status(404).json({success: false});
      return {success: false}; 
    }
    res?.status(200).json({data:{info:result[0]}, success: true});
    return {data:{info:result[0]}, success: true};
  } catch (error) {
    console.log(error);
    res?.status(500).json({success: false});
    return {success: false};
  }
}

const getBoards = async(req, res)=>{
  const query = `select * from post_category order by category_name`;
  try {
    const result = await sendQuery(query);

    if(result.length === 0){
      res?.status(404).json({success: false});
      return {success: false}; 
    }
    res?.status(200).json({data:{boards:result}, success: true});
    return {data:{boards:result}, success: true};
  } catch (error) {
    console.log(error);
    res?.status(500).json({success: false});
    return {success: false};
  }
}

const getFilteredBoards = async (req, res)=>{

  const {role, permission} = req.query;

  const query = `
    SELECT b.category_id, b.category_name
    FROM post_category b
    JOIN post_category_permission p
      ON p.category_id = b.category_id
    WHERE p.role = $1
      AND p.permission = $2
    ORDER BY b.category_id
  `;
  const params = [role, permission];
  try {
    const result = await sendQuery(query,params);
    res.status(200).json({boards:result, success:true});
  } catch (error) {
    res.status(500).json({success:false});
  }
}

const createBoard = async(req, res)=>{
  if (req.isAuthenticated() == false){
    return res.status(401).json({msg:"회원이 아닙니다.", success:false});
  }
  const {role:authRole} = req.user;
  if(authRole !== "ADMIN"){
    return res.status(403).json({msg:"권한없음", success:false});
  }

  const {boardName, isReply, isComment} = req.body;
  const query = `insert into (category_name, is_comment, is_reply) values ($1,$2,$3) returning *`
  const values = [boardName, isComment, isReply];
  try {
    const result = await sendQuery(query, values);
    res.status(201).json({board:result[0], success:true})
  } catch (error) {
    res.status(500).json({msg:"error",success:false})
  } 
}

//게시글 카테고리(게시판) 추가, 수정
const updateBoard = async(req, res)=>{
  if (req.isAuthenticated() == false){
    return res.status(401).json({msg:"회원이 아닙니다.", success:false});
  }
  const {role:authRole} = req.user;
  if(authRole !== "ADMIN"){
    return res.status(403).json({msg:"권한없음", success:false});
  }

  const {categoryId, categoryName, isReply, isComment} = req.body;

  if(categoryId === -1){// 카테고리 추가 로직
    const query = `insert into post_category (category_name, is_comment, is_reply) values($1,$2,$3) returning *`;
    const values = [categoryName, isComment, isReply];
    try {
      const result = await sendQuery(query, values);
      res.status(201).json({board:result[0], success:true});
    } catch (error) {
      res.status(500).json({success:false});
    }
    return
  }
  console.log({categoryId, categoryName, isReply, isComment})
  const query = `update post_category set category_name=$1, is_comment = $2, is_reply=$3 where category_id = $4 returning *`
  const values = [categoryName, isComment, isReply, categoryId];
  try {
    const result = await sendQuery(query, values);
    res.status(200).json({board:result[0], success:true})
  } catch (error) {
    res.status(500).json({msg:"error",success:false})
  } 
}

const boardPermissions = ["read","write","comment","reply"]

const getPermissions = async(req, res)=>{
  const {boardId} = req.params;
  const query = `select * from post_category_permission where category_id = $1`;
  const values = [boardId];
  try {
    const result = await sendQuery(query, values);
    res?.status(200).json({permissions:result, success:true});
    return {permissions:result, success:true};
  } catch (error) {
    console.log(error);
    res?.status(500).json({success:false});
    return {success:false};
  }
}

const getPermission = async(req, res)=>{
  // const {} = req.params;
  const {role, permission, boardId} = req.query;
  console.log(req.query)
  const query = `select 1 from post_category_permission 
                where category_id = $1 and role = $2 and permission = $3`;
  const values = [boardId,role,permission];
  
  try {
    const result = await sendQuery(query, values);
    if (result.length > 0){
      res?.status(200).json({permission:true, success:true});
      return true;
    }else{
      res?.status(200).json({permission:false, success:true});
      return false;
    }
  } catch (error) {
    console.log(error);
    res?.status(500).json({success:false});
    return false;
  }
}

const updatePermission = async(req,res)=>
{
  if (req.isAuthenticated() == false){
    return res.status(401).json({msg:"회원이 아닙니다.", success:false});
  }
  const {role:authRole} = req.user;
  if(authRole !== "ADMIN"){
    return res.status(403).json({msg:"권한없음", success:false});
  }
  const {boardId, permissions} = req.body;
  const query = `insert into post_category_permission(category_id, role, permission) values($1,$2,$3)`;
  try {
    await sendQuery(`delete from post_category_permission where category_id = $1`,[boardId]);
    // console.log(boardId,permissions);
    for(let i = 0; i < permissions.length; i++){
      await sendQuery(query,[boardId, permissions[i].role, permissions[i].permission]);
    }
    res?.status(200).json({success:true});
  } catch (error) {
    console.log(error)
    res?.status(500).json({msg:"error" ,success:false});
  }
}

const deletePermission = async(req, res)=>{
  if (req.isAuthenticated() == false){
    return res.status(401).json({msg:"회원이 아닙니다.", success:false});
  }
  const {role:authRole} = req.user;
  if(authRole !== "ADMIN"){
    return res.status(403).json({msg:"권한없음", success:false});
  }

  const {boardId, role, permission} = req.query;
  const query = `
    delete from post_category_permission 
    where 
      category_id = $1 
      and role = $2 
      ${permission?`and permission = $3`:""}
      `;
  const values = [boardId, role];
  if(permission) values.push(permission);
  try {
    await sendQuery(query,values);
    res.status(200).json({success:true});
  } catch (error) {
    console.log(error);
    res.status(500).json({success:false});
  }
}

module.exports = {getBoardInfo,getBoards, getPermission, getPermissions,createBoard, updatePermission, deletePermission,updateBoard,getFilteredBoards};