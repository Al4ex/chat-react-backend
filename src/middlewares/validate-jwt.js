import jwt from 'jsonwebtoken'
export const validarJWT = (req, res, next) => {
    try {
        const token = req.header('x-token')

        if (!token) {
            return res.status(401).json({
                ok: false,
                message: 'No hay token'
            })
        }
        const decode = jwt.verify(token, process.env.SECRET_KEY);
        req.user = decode;
        next()
    } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            return res.status(401).json({
                message: 'Session Expired',
                error: error.message,
            })
        }
        if (error instanceof jwt.JsonWebTokenError || error instanceof TokenError) {
            return res.status(401).json({
                message: 'Invalid Token',
                error: error.message,
            })
        }
        res.status(500).json({
            message: 'Internal server Error',
            error: error.message,
            stack: error.stack
        });

    }
}