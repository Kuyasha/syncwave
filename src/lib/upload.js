
const upload = async(imageFile) => {
    const formData = new FormData();
    formData.append("file", imageFile);
    formData.append("upload_preset", "chatapp");
    formData.append("cloud_name", "daisl2bl7");

    try{
        const res = await fetch("https://api.cloudinary.com/v1_1/daisl2bl7/image/upload",{
            method: "POST",
            body: formData,
        });
        const data = await res.json();
        return data.secure_url;
    }
    catch(error){
        console.error("Cloudinary upload error", error);
        throw error;
    }

}

export default upload;