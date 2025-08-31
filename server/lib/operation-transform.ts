/**
 * Operation Transformation (OT) system for conflict resolution
 * Ensures consistent state across all clients during concurrent edits
 */

export type OperationType = 
  | 'create' 
  | 'update' 
  | 'delete' 
  | 'move' 
  | 'resize' 
  | 'style';

export interface Operation {
  id: string;
  type: OperationType;
  elementId: string;
  timestamp: number;
  userId: string;
  version: number;
  data: any;
  parentVersion?: number;
}

export interface TransformResult {
  operation: Operation;
  transformed: boolean;
}

export class OperationTransformer {
  private operations: Map<string, Operation[]> = new Map();
  private versions: Map<string, number> = new Map();

  /**
   * Transform an operation against concurrent operations
   */
  transform(
    clientOp: Operation,
    serverOps: Operation[]
  ): TransformResult {
    let transformed = { ...clientOp };
    let wasTransformed = false;

    for (const serverOp of serverOps) {
      if (this.shouldTransform(clientOp, serverOp)) {
        const result = this.transformPair(transformed, serverOp);
        transformed = result.operation;
        wasTransformed = wasTransformed || result.transformed;
      }
    }

    return {
      operation: transformed,
      transformed: wasTransformed
    };
  }

  /**
   * Check if two operations need transformation
   */
  private shouldTransform(op1: Operation, op2: Operation): boolean {
    // Don't transform against self
    if (op1.id === op2.id) return false;

    // Check if operations affect the same element
    if (op1.elementId !== op2.elementId) return false;

    // Check temporal ordering
    return op1.parentVersion === op2.parentVersion;
  }

  /**
   * Transform a pair of concurrent operations
   */
  private transformPair(
    clientOp: Operation,
    serverOp: Operation
  ): TransformResult {
    // If server deleted the element, client operation becomes no-op
    if (serverOp.type === 'delete') {
      return {
        operation: { ...clientOp, type: 'delete' as OperationType },
        transformed: true
      };
    }

    // Transform based on operation types
    switch (clientOp.type) {
      case 'move':
        return this.transformMove(clientOp, serverOp);
      case 'resize':
        return this.transformResize(clientOp, serverOp);
      case 'update':
        return this.transformUpdate(clientOp, serverOp);
      case 'style':
        return this.transformStyle(clientOp, serverOp);
      default:
        return { operation: clientOp, transformed: false };
    }
  }

  /**
   * Transform move operations
   */
  private transformMove(
    clientOp: Operation,
    serverOp: Operation
  ): TransformResult {
    if (serverOp.type === 'move') {
      // Both operations move the same element
      // Use operational transformation to combine movements
      const clientDelta = {
        x: clientOp.data.x - (clientOp.data.originalX || 0),
        y: clientOp.data.y - (clientOp.data.originalY || 0)
      };
      
      const serverDelta = {
        x: serverOp.data.x - (serverOp.data.originalX || 0),
        y: serverOp.data.y - (serverOp.data.originalY || 0)
      };

      // Combine the deltas
      const transformedOp = {
        ...clientOp,
        data: {
          ...clientOp.data,
          x: serverOp.data.x + clientDelta.x,
          y: serverOp.data.y + clientDelta.y
        }
      };

      return { operation: transformedOp, transformed: true };
    }

    return { operation: clientOp, transformed: false };
  }

  /**
   * Transform resize operations
   */
  private transformResize(
    clientOp: Operation,
    serverOp: Operation
  ): TransformResult {
    if (serverOp.type === 'resize') {
      // Combine resize operations multiplicatively
      const clientScale = {
        x: clientOp.data.width / (clientOp.data.originalWidth || 1),
        y: clientOp.data.height / (clientOp.data.originalHeight || 1)
      };

      const transformedOp = {
        ...clientOp,
        data: {
          ...clientOp.data,
          width: serverOp.data.width * clientScale.x,
          height: serverOp.data.height * clientScale.y
        }
      };

      return { operation: transformedOp, transformed: true };
    }

    return { operation: clientOp, transformed: false };
  }

  /**
   * Transform update operations
   */
  private transformUpdate(
    clientOp: Operation,
    serverOp: Operation
  ): TransformResult {
    if (serverOp.type === 'update') {
      // Merge non-conflicting properties
      const merged = {
        ...serverOp.data,
        ...clientOp.data
      };

      // Handle conflicting properties with last-write-wins
      // but preserve client's explicit changes
      const transformedOp = {
        ...clientOp,
        data: merged
      };

      return { operation: transformedOp, transformed: true };
    }

    return { operation: clientOp, transformed: false };
  }

  /**
   * Transform style operations
   */
  private transformStyle(
    clientOp: Operation,
    serverOp: Operation
  ): TransformResult {
    if (serverOp.type === 'style') {
      // Merge style properties
      const transformedOp = {
        ...clientOp,
        data: {
          ...serverOp.data,
          ...clientOp.data
        }
      };

      return { operation: transformedOp, transformed: true };
    }

    return { operation: clientOp, transformed: false };
  }

  /**
   * Add operation to history
   */
  addOperation(boardId: string, operation: Operation): void {
    if (!this.operations.has(boardId)) {
      this.operations.set(boardId, []);
    }
    
    this.operations.get(boardId)!.push(operation);
    this.versions.set(boardId, operation.version);
  }

  /**
   * Get operations since a specific version
   */
  getOperationsSince(
    boardId: string,
    version: number
  ): Operation[] {
    const ops = this.operations.get(boardId) || [];
    return ops.filter(op => op.version > version);
  }

  /**
   * Get current version for a board
   */
  getCurrentVersion(boardId: string): number {
    return this.versions.get(boardId) || 0;
  }

  /**
   * Clean up old operations
   */
  cleanup(boardId: string, beforeVersion: number): void {
    const ops = this.operations.get(boardId);
    if (ops) {
      const filtered = ops.filter(op => op.version >= beforeVersion);
      this.operations.set(boardId, filtered);
    }
  }
}

// Singleton instance
export const operationTransformer = new OperationTransformer();