import AWS from 'aws-sdk';

// S3 객체 생성
const storage: AWS.S3 = new AWS.S3({
	accessKeyId: process.env.S3_ACCESS_KEY_ID as string,
	secretAccessKey: process.env.S3_SECRET_ACCESS_KEY as string,
	region: process.env.S3_REGION as string,
});

export default storage;
