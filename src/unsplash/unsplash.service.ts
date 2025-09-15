import { Injectable } from '@nestjs/common';

@Injectable()
export class UnsplashService {
  private readonly baseUrl = 'https://source.unsplash.com';
  
  /**
   * Gera URL de imagem aleatória do Unsplash para arquitetura/interior
   * @param width Largura da imagem (padrão: 800)
   * @param height Altura da imagem (padrão: 600)
   * @returns URL da imagem
   */
  getRandomArchitectureImage(width: number = 800, height: number = 600): string {
    // Usando source.unsplash.com que não requer API key
    return `${this.baseUrl}/${width}x${height}/?architecture,interior,home,apartment,house,modern`;
  }

  /**
   * Gera URL de imagem específica por ID do Unsplash
   * @param photoId ID da foto no Unsplash
   * @param width Largura da imagem
   * @param height Altura da imagem
   * @returns URL da imagem
   */
  getImageById(photoId: string, width: number = 800, height: number = 600): string {
    return `${this.baseUrl}/${photoId}/${width}x${height}`;
  }

  /**
   * Lista de IDs de fotos pré-selecionadas de arquitetura/interior
   * Estas são fotos específicas de alta qualidade para propriedades
   */
  private readonly architecturePhotoIds = [
    'photo-1568605114967-8130f3a36994', // Casa moderna
    'photo-1560448204-e02f11c3d0e2',   // Interior moderno
    'photo-1512917774080-9991f1c4c750', // Casa luxuosa
    'photo-1502672260266-1c1ef2d93688', // Apartamento moderno
    'photo-1600596542815-ffad4c1539a9', // Casa contemporânea
    'photo-1600607687939-ce8a6c25118c', // Interior elegante
    'photo-1600566753151-384129cf4e3e', // Apartamento loft
    'photo-1600573472550-8090b5e0745e', // Casa de praia
    'photo-1582407947304-fd86f028f716', // Interior luxuoso
    'photo-1600585154340-be6161a56a0c', // Casa moderna exterior
  ];

  /**
   * Retorna uma imagem de arquitetura aleatória de uma lista pré-selecionada
   * @param width Largura da imagem
   * @param height Altura da imagem
   * @returns URL da imagem
   */
  getRandomCuratedArchitectureImage(width: number = 800, height: number = 600): string {
    const randomIndex = Math.floor(Math.random() * this.architecturePhotoIds.length);
    const photoId = this.architecturePhotoIds[randomIndex];
    
    // Remove o prefixo 'photo-' se existir
    const cleanPhotoId = photoId.replace('photo-', '');
    return `https://images.unsplash.com/${photoId}?w=${width}&h=${height}&fit=crop&auto=format`;
  }

  /**
   * Valida se uma URL é uma imagem válida
   * @param url URL para validar
   * @returns boolean
   */
  isValidImageUrl(url: string): boolean {
    if (!url) return false;
    
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }
}
