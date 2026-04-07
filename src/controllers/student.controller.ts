import { asyncHandler } from "@/middlewares/error.js";
import { Student } from "@/models/student.model.js";
import { CustomRequest } from "@/types/types.js";
import { ApiError, ApiResponse } from "@/utils/responseHandler.js";
import { studentClanControllerValidator } from "@/validators/student.validator.js";
import z from "zod";



export const studentClanController = asyncHandler(
    async (req: CustomRequest<z.infer<typeof studentClanControllerValidator>>, res) => {
        const [studentClan] = await Student.aggregate([
            {
                $match: {
                    enrollmentNumber: req.validatedBody?.enrollmentNumber
                }
            },
            {
                $lookup: {
                    from: "clans",
                    localField: "clanId",
                    foreignField: "_id",
                    as: "clan"
                }
            },
            {
                $unwind: {
                    path: "$clan",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $project: {
                    _id: 0,
                    clanName: "$clan.name",
                    memberCount:"$clan.memberCount",
                    clanLogo:"$clan.image"
                }
            }
        ]);

        if (!studentClan)
            return res.status(404).json(new ApiError(404, "Student not found"));

        return res.status(200).json(new ApiResponse(studentClan, "Clan retrieved successfully", 200));
    }
)