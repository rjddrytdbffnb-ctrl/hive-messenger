// src/services/mockApi.ts
import { User, LoginData, RegisterData, AuthResponse } from '../context/AuthContext';

// Моковые данные для тестирования
const mockUsers: User[] = [
  {
    id: '1',
    username: 'admin',
    email: 'admin@company.com',
    firstName: 'Андрей',
    lastName: 'Калугин',
    department: 'IT',
    isOnline: true
  },
  {
    id: '2',
    username: 'manager',
    email: 'manager@company.com',
    firstName: 'Мария',
    lastName: 'Иванова',
    department: 'Management',
    isOnline: false
  }
];

let currentUser: User | null = null;

export const mockAuthAPI = {
  login: async (data: LoginData): Promise<{ data: AuthResponse }> => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const user = mockUsers.find(u => u.email === data.email);
    
    if (user && data.password === 'password') {
      currentUser = user;
      return {
        data: {
          token: 'mock-jwt-token-' + Date.now(),
          user: user
        }
      };
    } else {
      throw {
        response: {
          data: { message: 'Неверный email или пароль' }
        }
      };
    }
  },

  register: async (data: RegisterData): Promise<{ data: AuthResponse }> => {
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const existingUser = mockUsers.find(
      u => u.email === data.email || u.username === data.username
    );
    
    if (existingUser) {
      throw {
        response: {
          data: { message: 'Пользователь с таким email или именем уже существует' }
        }
      };
    }
    
    const newUser: User = {
      id: (mockUsers.length + 1).toString(),
      username: data.username,
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      department: data.department,
      isOnline: true
    };
    
    mockUsers.push(newUser);
    currentUser = newUser;
    
    return {
      data: {
        token: 'mock-jwt-token-' + Date.now(),
        user: newUser
      }
    };
  },

  getProfile: async (): Promise<{ data: User }> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (currentUser) {
      return { data: currentUser };
    } else {
      throw new Error('Пользователь не авторизован');
    }
  }
};

export const mockUsersAPI = {
  getAll: async (): Promise<{ data: User[] }> => {
    await new Promise(resolve => setTimeout(resolve, 800));
    return { data: mockUsers };
  }
};