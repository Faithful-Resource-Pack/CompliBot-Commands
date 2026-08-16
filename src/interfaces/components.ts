import { Client } from "@client";
import { AnyInteraction } from "./interactions";
import { ComponentInContainer, MessageActionRowComponent, TopLevelComponent } from "discord.js";

// all components use same interface for reusable initialization
export interface Component<T extends AnyInteraction = AnyInteraction> {
	id: string;
	execute: ComponentExecute<T>;
}

export type ComponentExecute<T> = (client: Client, interaction: T) => void;

// why is this not provided by default
export type AnyV2Component = TopLevelComponent | ComponentInContainer | MessageActionRowComponent;

export const defineComponent = <T extends AnyInteraction>(data: Component<T>) => data;
