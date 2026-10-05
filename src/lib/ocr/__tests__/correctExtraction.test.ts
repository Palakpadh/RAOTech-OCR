import { describe, it, expect } from "vitest";
import { correctExtraction, parseAmountInWords } from "../correctExtraction";
import { cleanMoney } from "../../accounting/normalize";

describe("parseAmountInWords", () => {
  it("parses lakhs and thousands correctly", () => {
    expect(parseAmountInWords("INR Four Lakh Sixteen Thousand Only")).toBe(416000);
    expect(parseAmountInWords("Three Lakh Ninety Six Thousand One Hundred Ninety")).toBe(396190);
  });
});

describe("correctExtraction", () => {
  it("reverses GSTIN swap when vendor address state matches customer GSTIN", () => {
    const raw = {
      vendor: "KALPATARU AUTOMOBILES - (2026-27)",
      vendor_address: "Near Shri Hari Party Plot, Kalol-Mansa Road, Kalol,Dist:Gandhinagar Gujarat",
      vendor_gstin: "24AABCJ8501F1ZY", // Customer's GSTIN accidentally extracted as Vendor GSTIN
      customer_name: "Jsw Infrastructure Pvt. Ltd.",
      customer_gstin: "24AATFK1007E1ZO", // Vendor's GSTIN accidentally extracted as Customer GSTIN
      total_amount: 416,
      amount_in_words: "Four Lakh Sixteen Thousand Only",
      subtotal: 396.19,
      cgst: 9.90,
      sgst: 9.90,
      items: [
        { name: "1 JIVO-225 4 WD PS", price: 396.19, qty: 1 }
      ]
    };

    const { data, corrections } = correctExtraction(raw);

    // GSTIN swap corrected
    expect(data.vendor_gstin).toBe("24AATFK1007E1ZO");
    expect(data.customer_gstin).toBe("24AABCJ8501F1ZY");

    // Amount scaled by 1000 from 416 -> 416000
    expect(data.total_amount).toBe(416000);
    expect(data.subtotal).toBe(396190);
    expect(data.cgst).toBe(9900);
    expect(data.sgst).toBe(9900);
    expect(corrections.length).toBeGreaterThan(0);
  });
});

describe("cleanMoney", () => {
  it("handles Indian format comma numbers", () => {
    expect(cleanMoney("3,96,190.19")).toBe(396190.19);
    expect(cleanMoney("₹4,16,000.00")).toBe(416000);
  });
});
