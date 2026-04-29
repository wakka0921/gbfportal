import { google } from 'googleapis';

export interface GuildMember {
    name: string;
    twitterId: string;
    role: string;
    rank: number;
    prevRank: number;
    rankDiff: number;
    gbfId: string;
    contribution: string;
    ageGroup: string;
    memo: string;
    gwExperience: boolean;
}

export interface GuildStats {
    lastUpdated: string;
    prevUpdated: string;
    totalContribution: string;
    averageRank: number;
    guildRank: string;
    memberCount: number;
    viceMasterCount: number;
}

export async function getGuildSheetData() {
    const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;
    const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (!spreadsheetId || !clientEmail || !privateKey) {
        console.error('Google Sheets API credentials missing in environment variables.');
        return null;
    }

    try {
        const auth = new google.auth.JWT({
            email: clientEmail,
            key: privateKey,
            scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly']
        });

        const sheets = google.sheets({ version: 'v4', auth });

        // Fetch the summary and member data
        // Summary: A1:N2, Members: A4:N50
        const response = await sheets.spreadsheets.values.batchGet({
            spreadsheetId,
            ranges: ['A1:N2', 'A4:N50'],
        });

        const valueRanges = response.data.valueRanges;
        if (!valueRanges || valueRanges.length < 2) return null;

        const summaryData = valueRanges[0].values || [];
        const memberData = valueRanges[1].values || [];

        // Parse Summary
        // Row 1: 更新 [C1=2], 前回更新 [E1=4], 直近団貢献度 [G1=6]
        // Row 2: 平均ランク [C2=2], 団順位 [G2=6], 団員数 [I2=8]
        const baseStats = {
            lastUpdated: summaryData[0]?.[2] || '-',
            prevUpdated: summaryData[0]?.[4] || '-',
            totalContribution: summaryData[0]?.[6] || '0',
            averageRank: parseInt(summaryData[1]?.[2] || '0'),
            guildRank: summaryData[1]?.[6] || '-',
            memberCount: parseInt(summaryData[1]?.[8] || '0'),
        };

        // Parse Members
        // A=0:name, B=1:twitter, C=2:role, D=3:rank, E=4:prev, F=5:diff, G=6:gbfid, H=7:contribution, I=8:age, J=9:memo, K=10:gw
        const members: GuildMember[] = memberData.map(row => ({
            name: row[0] || '-',
            twitterId: row[1] || '-',
            role: row[2] || '-',
            rank: parseInt(row[3] || '0'),
            prevRank: parseInt(row[4] || '0'),
            rankDiff: parseInt(row[5] || '0'),
            gbfId: row[6] || '-',
            contribution: row[7] || '0',
            ageGroup: row[8] || '-',
            memo: row[9] || '-',
            gwExperience: row[10]?.includes('はい') || false,
        }));

        const viceMasterCount = members.filter(m => m.role.includes('副団長')).length;
        const stats: GuildStats = { ...baseStats, viceMasterCount };

        return { stats, members };
    } catch (error) {
        console.error('Error fetching Google Sheet data:', error);
        return null;
    }
}
