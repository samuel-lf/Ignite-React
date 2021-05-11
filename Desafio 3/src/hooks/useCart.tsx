import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart =  localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const updatedCart = [...cart]
      const ProductExists = updatedCart.find((product) => product.id === productId)

      if(ProductExists){
        const responseStock = await api.get(`/stock/${productId}`);
        const stock = responseStock.data;
        
        if(ProductExists.amount + 1 > stock.amount){
          toast.error('Quantidade solicitada fora de estoque');
          return;
        }
        
        ProductExists.amount = ProductExists.amount + 1
      } else {
        const products = await api.get(`/products/${productId}`);

        const newProduct = {
          ...products.data,
          amount: 1
        }

        updatedCart.push(newProduct);
      }

      setCart(updatedCart)
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart));
    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const updatedCart = [...cart]
      const ProductExists = updatedCart.findIndex((product) => product.id === productId)

      if(ProductExists < 0){
        toast.error('Erro na remoção do produto');
        return;
      }

      updatedCart.splice(1, ProductExists)

      setCart(updatedCart)
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart));
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if(amount <= 0){
        return
      }
      
      const updatedCart = [...cart]
      const ProductExists = updatedCart.find((product) => product.id === productId)

      if(ProductExists){
        const responseStock = await api.get(`/stock/${productId}`);
        const stock = responseStock.data;

        if(amount > stock.amount){
          toast.error('Quantidade solicitada fora de estoque');
          return;
        }

        ProductExists.amount = ProductExists.amount + 1
      } else {
        toast.error('Erro na alteração de quantidade do produto');
        return;
      }

      setCart(updatedCart)
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart));

    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
