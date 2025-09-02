import { fabric } from 'fabric';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

export type TemplateCategory = 
  | 'Business' 
  | 'Education' 
  | 'Design' 
  | 'Marketing' 
  | 'Development' 
  | 'Personal';

export interface Template {
  id: string;
  name: string;
  description?: string;
  category: TemplateCategory;
  tags?: string[];
  data: any;
  thumbnailUrl?: string;
  isPublic: boolean;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
  usageCount: number;
  averageRating?: number;
  teamId?: string;
  parentTemplateId?: string;
  modifications?: Record<string, any>;
  placeholders?: Record<string, PlaceholderConfig>;
  currentVersion?: number;
}

export interface PlaceholderConfig {
  type: 'text' | 'image' | 'color' | 'number';
  default?: any;
  validation?: string;
  required?: boolean;
}

export interface TemplateVersion {
  templateId: string;
  versionNumber: number;
  versionNotes?: string;
  data: any;
  createdAt: Date;
}

export interface TemplateAnalytics {
  totalUses: number;
  uniqueUsers: number;
  averageRating: number;
  completionRate: number;
  popularPlaceholders?: Record<string, number>;
}

export interface TemplateSuggestion {
  type: 'layout' | 'color' | 'content' | 'accessibility';
  description: string;
  impact: 'high' | 'medium' | 'low';
  autoApplicable: boolean;
}

export class AdvancedTemplateManager {
  private canvas: fabric.Canvas;
  private supabase: SupabaseClient | null = null;
  private templates: Map<string, Template> = new Map();
  private versions: Map<string, TemplateVersion[]> = new Map();
  private userHistory: Map<string, string[]> = new Map();

  constructor(canvas: fabric.Canvas, supabaseUrl?: string, supabaseKey?: string) {
    this.canvas = canvas;
    
    if (supabaseUrl && supabaseKey) {
      this.supabase = createClient(supabaseUrl, supabaseKey);
    }
    
    this.initializeDefaultTemplates();
  }

  private initializeDefaultTemplates(): void {
    // Initialize with some default templates
    const defaultTemplates: Partial<Template>[] = [
      {
        id: 'default-business-1',
        name: 'Business Model Canvas',
        category: 'Business',
        tags: ['strategy', 'planning', 'canvas'],
        isPublic: true,
        usageCount: 0
      },
      {
        id: 'default-education-1',
        name: 'Lesson Plan',
        category: 'Education',
        tags: ['teaching', 'planning', 'education'],
        isPublic: true,
        usageCount: 0
      }
    ];
    
    defaultTemplates.forEach(template => {
      this.templates.set(template.id!, {
        ...template,
        data: {},
        createdAt: new Date(),
        updatedAt: new Date(),
        usageCount: 0,
        isPublic: true
      } as Template);
    });
  }

  getCategories(): TemplateCategory[] {
    return ['Business', 'Education', 'Design', 'Marketing', 'Development', 'Personal'];
  }

  async getTemplatesByCategory(category: TemplateCategory): Promise<Template[]> {
    if (this.supabase) {
      const { data, error } = await this.supabase
        .from('board_templates')
        .select('*')
        .eq('category', category);
      
      if (!error && data) {
        return data;
      }
    }
    
    return Array.from(this.templates.values()).filter(t => t.category === category);
  }

  async createTemplate(data: {
    name: string;
    description?: string;
    category: TemplateCategory;
    tags?: string[];
    isPublic?: boolean;
  }): Promise<Template> {
    const canvasData = this.canvas.toJSON();
    const thumbnailUrl = await this.generateThumbnail();
    
    const template: Template = {
      id: `template-${Date.now()}`,
      name: data.name,
      description: data.description,
      category: data.category,
      tags: data.tags || [],
      data: canvasData,
      thumbnailUrl,
      isPublic: data.isPublic ?? false,
      createdAt: new Date(),
      updatedAt: new Date(),
      usageCount: 0
    };
    
    if (this.supabase) {
      const { data: savedTemplate, error } = await this.supabase
        .from('board_templates')
        .insert(template);
      
      if (!error && savedTemplate) {
        template.id = savedTemplate.id;
      }
    }
    
    this.templates.set(template.id, template);
    return template;
  }

  private async generateThumbnail(): Promise<string> {
    const dataUrl = this.canvas.toDataURL({
      format: 'png',
      quality: 0.8,
      multiplier: 0.5
    });
    
    if (this.supabase) {
      const blob = this.dataURLtoBlob(dataUrl);
      const fileName = `thumbnails/template-${Date.now()}.png`;
      
      const { data, error } = await this.supabase.storage
        .from('templates')
        .upload(fileName, blob);
      
      if (!error && data) {
        const { data: urlData } = this.supabase.storage
          .from('templates')
          .getPublicUrl(fileName);
        
        return urlData.publicUrl;
      }
    }
    
    return dataUrl;
  }

  private dataURLtoBlob(dataURL: string): Blob {
    const arr = dataURL.split(',');
    const mime = arr[0].match(/:(.*?);/)![1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    
    return new Blob([u8arr], { type: mime });
  }

  async createVariation(
    parentTemplateId: string,
    data: {
      name: string;
      modifications: Record<string, any>;
    }
  ): Promise<Template> {
    const parentTemplate = this.templates.get(parentTemplateId);
    if (!parentTemplate) {
      throw new Error('Parent template not found');
    }
    
    const variation: Template = {
      ...parentTemplate,
      id: `template-${Date.now()}`,
      name: data.name,
      parentTemplateId,
      modifications: data.modifications,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.templates.set(variation.id, variation);
    return variation;
  }

  async applyTemplate(templateId: string): Promise<void> {
    const template = await this.getTemplate(templateId);
    if (!template) {
      throw new Error('Template not found');
    }
    
    this.canvas.clear();
    
    return new Promise((resolve) => {
      this.canvas.loadFromJSON(template.data, () => {
        this.canvas.renderAll();
        this.trackUsage(templateId, 'current-user');
        resolve();
      });
    });
  }

  async mergeTemplate(templateId: string): Promise<void> {
    const template = await this.getTemplate(templateId);
    if (!template) {
      throw new Error('Template not found');
    }
    
    const objects = template.data.objects || [];
    objects.forEach((objData: any) => {
      fabric.util.enlivenObjects([objData], (objects: fabric.Object[]) => {
        objects.forEach(obj => this.canvas.add(obj));
      });
    });
    
    this.canvas.renderAll();
    this.trackUsage(templateId, 'current-user');
  }

  async applyTemplateWithParams(
    templateId: string,
    parameters: Record<string, any>
  ): Promise<void> {
    const template = await this.getTemplate(templateId);
    if (!template) {
      throw new Error('Template not found');
    }
    
    const modifiedData = this.applyParameters(template.data, parameters);
    
    return new Promise((resolve) => {
      this.canvas.loadFromJSON(modifiedData, () => {
        this.canvas.renderAll();
        this.trackUsage(templateId, 'current-user');
        resolve();
      });
    });
  }

  private applyParameters(templateData: any, parameters: Record<string, any>): any {
    const data = JSON.parse(JSON.stringify(templateData));
    
    data.objects?.forEach((obj: any) => {
      // Apply color parameters
      if (parameters.primaryColor && obj.fill) {
        obj.fill = parameters.primaryColor;
      }
      
      // Apply text parameters
      if (obj.type === 'text' || obj.type === 'i-text') {
        if (parameters.fontSize) {
          obj.fontSize = parameters.fontSize;
        }
        if (parameters.companyName && obj.text?.includes('[COMPANY]')) {
          obj.text = obj.text.replace('[COMPANY]', parameters.companyName);
        }
      }
    });
    
    return data;
  }

  async searchTemplates(keyword: string): Promise<Template[]> {
    const lowerKeyword = keyword.toLowerCase();
    
    if (this.supabase) {
      const { data } = await this.supabase
        .from('board_templates')
        .select('*')
        .or(`name.ilike.%${keyword}%,description.ilike.%${keyword}%`);
      
      if (data) {
        return data;
      }
    }
    
    return Array.from(this.templates.values()).filter(template => {
      return template.name.toLowerCase().includes(lowerKeyword) ||
        template.description?.toLowerCase().includes(lowerKeyword) ||
        template.tags?.some(tag => tag.toLowerCase().includes(lowerKeyword));
    });
  }

  async getPopularTemplates(limit: number = 10): Promise<Template[]> {
    const templates = Array.from(this.templates.values());
    return templates
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, limit);
  }

  async getRecentTemplates(userId: string, limit: number = 5): Promise<Template[]> {
    const history = this.userHistory.get(userId) || [];
    const recentIds = history.slice(0, limit);
    
    return recentIds
      .map(id => this.templates.get(id))
      .filter(Boolean) as Template[];
  }

  async getRecommendedTemplates(userId: string): Promise<Template[]> {
    // Simple recommendation based on usage history
    const history = this.userHistory.get(userId) || [];
    const usedCategories = new Set<TemplateCategory>();
    
    history.forEach(templateId => {
      const template = this.templates.get(templateId);
      if (template) {
        usedCategories.add(template.category);
      }
    });
    
    return Array.from(this.templates.values())
      .filter(t => usedCategories.has(t.category) && !history.includes(t.id))
      .slice(0, 10);
  }

  async updateTemplate(
    templateId: string,
    updates: Partial<Template>
  ): Promise<Template> {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error('Template not found');
    }
    
    const updated = {
      ...template,
      ...updates,
      updatedAt: new Date()
    };
    
    if (this.supabase) {
      await this.supabase
        .from('board_templates')
        .update(updates)
        .eq('id', templateId);
    }
    
    this.templates.set(templateId, updated);
    return updated;
  }

  async duplicateTemplate(
    templateId: string,
    overrides?: Partial<Template>
  ): Promise<Template> {
    const original = this.templates.get(templateId);
    if (!original) {
      throw new Error('Template not found');
    }
    
    const duplicate: Template = {
      ...original,
      ...overrides,
      id: `template-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
      usageCount: 0
    };
    
    this.templates.set(duplicate.id, duplicate);
    return duplicate;
  }

  async deleteTemplate(templateId: string): Promise<boolean> {
    if (this.supabase) {
      const { error } = await this.supabase
        .from('board_templates')
        .delete()
        .eq('id', templateId);
      
      if (error) {
        return false;
      }
    }
    
    return this.templates.delete(templateId);
  }

  async exportTemplate(templateId: string, format: 'json' | 'zip'): Promise<any> {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error('Template not found');
    }
    
    if (format === 'json') {
      return {
        name: template.name,
        data: template.data,
        metadata: {
          category: template.category,
          tags: template.tags,
          description: template.description
        }
      };
    }
    
    // For zip format, would need additional implementation
    throw new Error('ZIP export not yet implemented');
  }

  async importTemplate(data: any): Promise<Template> {
    const template: Template = {
      id: `template-${Date.now()}`,
      name: data.name,
      description: data.description,
      category: data.category || 'Personal',
      tags: data.tags || [],
      data: data.data,
      isPublic: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      usageCount: 0
    };
    
    this.templates.set(template.id, template);
    return template;
  }

  async createSmartTemplate(config: {
    name: string;
    category: TemplateCategory;
    placeholders: Record<string, PlaceholderConfig>;
  }): Promise<Template> {
    const template: Template = {
      id: `smart-template-${Date.now()}`,
      name: config.name,
      category: config.category,
      placeholders: config.placeholders,
      data: this.canvas.toJSON(),
      isPublic: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      usageCount: 0
    };
    
    this.templates.set(template.id, template);
    return template;
  }

  async applySmartTemplate(
    templateId: string,
    userData: Record<string, any>
  ): Promise<void> {
    const template = this.templates.get(templateId);
    if (!template || !template.placeholders) {
      throw new Error('Smart template not found');
    }
    
    // Validate user data
    if (!this.validateTemplateData(template, userData)) {
      throw new Error('Invalid template data');
    }
    
    // Apply template with user data
    const processedData = this.processSmartTemplate(template.data, template.placeholders, userData);
    
    return new Promise((resolve) => {
      this.canvas.loadFromJSON(processedData, () => {
        this.canvas.renderAll();
        resolve();
      });
    });
  }

  private processSmartTemplate(
    templateData: any,
    placeholders: Record<string, PlaceholderConfig>,
    userData: Record<string, any>
  ): any {
    const data = JSON.parse(JSON.stringify(templateData));
    
    data.objects?.forEach((obj: any) => {
      Object.keys(placeholders).forEach(key => {
        const placeholder = placeholders[key];
        const value = userData[key] || placeholder.default;
        
        if (placeholder.type === 'text' && obj.text?.includes(`{{${key}}}`)) {
          obj.text = obj.text.replace(`{{${key}}}`, value);
        } else if (placeholder.type === 'color' && obj.fill === `{{${key}}}`) {
          obj.fill = value;
        }
      });
    });
    
    return data;
  }

  validateTemplateData(
    template: any,
    data: Record<string, any>
  ): boolean {
    if (!template.placeholders) return true;
    
    for (const [key, config] of Object.entries(template.placeholders)) {
      const placeholder = config as PlaceholderConfig;
      const value = data[key];
      
      if (placeholder.required && !value) {
        return false;
      }
      
      if (value && placeholder.validation) {
        if (placeholder.validation === 'email' && !this.isValidEmail(value)) {
          return false;
        }
        if (placeholder.validation === 'phone' && !this.isValidPhone(value)) {
          return false;
        }
      }
    }
    
    return true;
  }

  private isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  private isValidPhone(phone: string): boolean {
    return /^\+?[\d\s-()]+$/.test(phone) && phone.replace(/\D/g, '').length >= 10;
  }

  async trackUsage(templateId: string, userId: string): Promise<void> {
    const template = this.templates.get(templateId);
    if (template) {
      template.usageCount++;
      
      // Update user history
      const history = this.userHistory.get(userId) || [];
      const filtered = history.filter(id => id !== templateId);
      filtered.unshift(templateId);
      this.userHistory.set(userId, filtered.slice(0, 50));
    }
  }

  async getTemplateStats(templateId: string): Promise<Template> {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error('Template not found');
    }
    return template;
  }

  async getTemplateAnalytics(templateId: string): Promise<TemplateAnalytics> {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error('Template not found');
    }
    
    return {
      totalUses: template.usageCount,
      uniqueUsers: Math.floor(template.usageCount * 0.7), // Mock data
      averageRating: template.averageRating || 4.5,
      completionRate: 0.85
    };
  }

  async rateTemplate(
    templateId: string,
    userId: string,
    rating: number
  ): Promise<boolean> {
    const template = this.templates.get(templateId);
    if (!template || rating < 1 || rating > 5) {
      return false;
    }
    
    // Simple average calculation (in real app, would track individual ratings)
    const currentRating = template.averageRating || 0;
    const currentCount = template.usageCount || 1;
    template.averageRating = (currentRating * (currentCount - 1) + rating) / currentCount;
    
    return true;
  }

  async shareWithTeam(
    templateId: string,
    teamId: string,
    permissions: { canEdit: boolean; canDuplicate: boolean }
  ): Promise<boolean> {
    const template = this.templates.get(templateId);
    if (!template) {
      return false;
    }
    
    template.teamId = teamId;
    // In real app, would store permissions in database
    
    return true;
  }

  async getTeamTemplates(teamId: string): Promise<Template[]> {
    return Array.from(this.templates.values())
      .filter(t => t.teamId === teamId);
  }

  async checkPermission(
    templateId: string,
    userId: string,
    action: 'view' | 'edit' | 'delete'
  ): Promise<boolean> {
    const template = this.templates.get(templateId);
    if (!template) {
      return false;
    }
    
    // Simple permission check (in real app, would check database)
    if (action === 'view') {
      return template.isPublic || template.createdBy === userId;
    }
    
    return template.createdBy === userId;
  }

  async createVersion(
    templateId: string,
    metadata?: { versionNotes?: string }
  ): Promise<TemplateVersion> {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error('Template not found');
    }
    
    const versions = this.versions.get(templateId) || [];
    const versionNumber = versions.length + 1;
    
    const version: TemplateVersion = {
      templateId,
      versionNumber,
      versionNotes: metadata?.versionNotes,
      data: JSON.parse(JSON.stringify(template.data)),
      createdAt: new Date()
    };
    
    versions.push(version);
    this.versions.set(templateId, versions);
    
    template.currentVersion = versionNumber;
    
    return version;
  }

  async getVersionHistory(templateId: string): Promise<TemplateVersion[]> {
    return this.versions.get(templateId) || [];
  }

  async revertToVersion(
    templateId: string,
    versionNumber: number
  ): Promise<Template> {
    const template = this.templates.get(templateId);
    const versions = this.versions.get(templateId);
    
    if (!template || !versions) {
      throw new Error('Template or version not found');
    }
    
    const version = versions.find(v => v.versionNumber === versionNumber);
    if (!version) {
      throw new Error('Version not found');
    }
    
    template.data = version.data;
    template.currentVersion = versionNumber;
    template.updatedAt = new Date();
    
    return template;
  }

  async generateFromDescription(description: string): Promise<Template> {
    // Simple mock implementation
    const keywords = description.toLowerCase();
    let category: TemplateCategory = 'Personal';
    
    if (keywords.includes('business') || keywords.includes('project')) {
      category = 'Business';
    } else if (keywords.includes('lesson') || keywords.includes('education')) {
      category = 'Education';
    } else if (keywords.includes('design') || keywords.includes('creative')) {
      category = 'Design';
    }
    
    const template: Template = {
      id: `generated-${Date.now()}`,
      name: `Generated: ${description.slice(0, 50)}`,
      description: `AI-generated template based on: ${description}`,
      category,
      data: {
        objects: [
          {
            type: 'text',
            text: description,
            left: 100,
            top: 100
          }
        ]
      },
      isPublic: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      usageCount: 0
    };
    
    this.templates.set(template.id, template);
    return template;
  }

  async getSuggestions(templateId: string): Promise<TemplateSuggestion[]> {
    const template = this.templates.get(templateId);
    if (!template) {
      return [];
    }
    
    const suggestions: TemplateSuggestion[] = [];
    
    // Analyze template and provide suggestions
    const objects = template.data.objects || [];
    
    if (objects.length > 50) {
      suggestions.push({
        type: 'layout',
        description: 'Consider grouping related elements to improve organization',
        impact: 'high',
        autoApplicable: false
      });
    }
    
    // Check for accessibility
    const hasText = objects.some((obj: any) => obj.type === 'text' || obj.type === 'i-text');
    if (hasText) {
      suggestions.push({
        type: 'accessibility',
        description: 'Ensure text has sufficient contrast with background',
        impact: 'medium',
        autoApplicable: true
      });
    }
    
    return suggestions;
  }

  async autoCategorize(templateData: any): Promise<TemplateCategory> {
    const text = JSON.stringify(templateData).toLowerCase();
    
    if (text.includes('revenue') || text.includes('business') || text.includes('chart')) {
      return 'Business';
    } else if (text.includes('lesson') || text.includes('student') || text.includes('education')) {
      return 'Education';
    } else if (text.includes('design') || text.includes('creative') || text.includes('color')) {
      return 'Design';
    } else if (text.includes('marketing') || text.includes('campaign') || text.includes('social')) {
      return 'Marketing';
    } else if (text.includes('code') || text.includes('development') || text.includes('api')) {
      return 'Development';
    }
    
    return 'Personal';
  }

  private async getTemplate(templateId: string): Promise<Template | null> {
    if (this.templates.has(templateId)) {
      return this.templates.get(templateId)!;
    }
    
    if (this.supabase) {
      const { data } = await this.supabase
        .from('board_templates')
        .select('*')
        .eq('id', templateId)
        .single();
      
      if (data) {
        this.templates.set(templateId, data);
        return data;
      }
    }
    
    return null;
  }
}