import jwt from 'jsonwebtoken';

export const createTokenAndSavedCookie = (userId, res) =>{
    const token = jwt.sign({userId}, process.env.JWT_SECRET, {expiresIn: "5d"})

    res.cookie("token", token, {
        httpOnly:true, //xss
        secure: true,
        sameSite: "strict", //csrf
        maxAge: 5 * 24 * 60 * 60 * 1000, // 5 days
    })
}