import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'honghong-simulator-secret-key-2024';

export interface JwtPayload {
  userId: number;
  username: string;
}

/**
 * 密码哈希
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

/**
 * 验证密码
 */
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

/**
 * 生成JWT Token
 */
export function generateToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

/**
 * 验证JWT Token
 */
export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch {
    return null;
  }
}

/**
 * 从请求头或直接 token 字符串中提取用户信息
 */
export function getUserFromToken(tokenOrAuthHeader: string | null): JwtPayload | null {
  if (!tokenOrAuthHeader) {
    return null;
  }
  
  // 如果是 Bearer 开头的认证头，提取 token
  const token = tokenOrAuthHeader.startsWith('Bearer ') 
    ? tokenOrAuthHeader.substring(7) 
    : tokenOrAuthHeader;
    
  return verifyToken(token);
}
