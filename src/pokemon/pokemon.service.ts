import { Injectable, BadRequestException, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { isValidObjectId, Model } from 'mongoose';
import { PaginationDto } from 'src/common/dto/paginatio.dto';
import { CreatePokemonDto } from './dto/create-pokemon.dto';
import { UpdatePokemonDto } from './dto/update-pokemon.dto';
import { Pokemon } from './entities/pokemon.entity';

@Injectable()
export class PokemonService {


  private defaultLimit: number;
  constructor(
    @InjectModel(Pokemon.name)
    private readonly pokemonModel: Model<Pokemon>,
    private readonly configService: ConfigService
  ) {
    this.defaultLimit = this.configService.get<number>('defaultLimit');
  }

  async create(createPokemonDto: CreatePokemonDto) {
    createPokemonDto.name = createPokemonDto.name.toLocaleLowerCase();
    try {
      const pokemon = await this.pokemonModel.create(createPokemonDto);
      return pokemon;
    } catch (error) {
      this.handleExceptions(error);
    }
  }

  findAll(paginationDto: PaginationDto) {
    const { limit = this.defaultLimit, offset = 0 } = paginationDto;

    return this.pokemonModel.find()
      .limit(limit)
      .skip(offset)
      .sort({
        no: 1
      })
      .select(['-__v'])


  }

  async findOne(searchValue: string) {
    let pokemon: Pokemon;

    if (!isNaN(+searchValue)) {
      pokemon = await this.pokemonModel.findOne({ no: searchValue });
    }

    if (!pokemon && isValidObjectId(searchValue)) {
      pokemon = await this.pokemonModel.findById(searchValue);
    }

    if (!pokemon) {
      pokemon = await this.pokemonModel.findOne({ name: searchValue.toLocaleLowerCase().trim() });
    }

    if (!pokemon) throw new NotFoundException(`Pokemon con id, no o name ${searchValue} no se encontro`);


    return pokemon;
  }

  async update(searchValue: string, updatePokemonDto: UpdatePokemonDto) {
    const pokemonDb = await this.findOne(searchValue);
    if (updatePokemonDto.name) {
      updatePokemonDto.name = updatePokemonDto.name.toLocaleLowerCase();
    }

    try {
      await pokemonDb.updateOne(updatePokemonDto);
      return { ...pokemonDb.toJSON(), ...updatePokemonDto };
    } catch (error) {
      this.handleExceptions(error);
    }

  }

  async remove(id: string) {
    const { deletedCount } = await this.pokemonModel.deleteOne({ _id: id });

    if (deletedCount === 0) {
      throw new BadRequestException(`El pokemon con id ${id} no existe`);
    }

    return;
  }

  private handleExceptions(error: any) {
    if (error.code === 11000) {
      throw new BadRequestException(`El pokemon a editar contiene valores duplicados en base de datos ${JSON.stringify(error.keyValue)}`);
    }

    console.log(error);
    throw new InternalServerErrorException(`Error al crear un pokemon`);
  }
}
