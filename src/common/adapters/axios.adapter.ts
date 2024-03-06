import { HttpAdapter } from "../interfaces/http-adapter.interface";
import axios, { AxiosInstance } from 'axios';
import { Injectable } from "@nestjs/common";

@Injectable()
export class AxiosAdapter implements HttpAdapter {

    private readonly axios: AxiosInstance = axios;

    async get<T>(url: string): Promise<T> {
        try {
            const { data } = await axios.get<T>(url);
            return data;
        } catch (error) {
            throw new Error("Server error, check logs");
        }
    }

}