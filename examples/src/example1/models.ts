import {Attribute} from "evalvite";

// sometimes you have to split this into a different file that can be read by both app
// and example1 or you get an import cycle... this wasn't strictly necessary here.
export type ImportantCheckBoxModel = {
  important: Attribute<boolean>;
}
