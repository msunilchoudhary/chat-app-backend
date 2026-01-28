import jwt from 'jsonwebtoken';

export const isAuthenticated = (req, res, next) => {
    const token = req.cookies.token;

    if(!token){
        return res.status(401).json({
            message:"Not authenticated"
        })
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = decoded.id;
        
        next()
        
    } catch (error) {
        console.log(error.message);
        res.status(401).json({
            message:"Invailid token"
        })
    }
}